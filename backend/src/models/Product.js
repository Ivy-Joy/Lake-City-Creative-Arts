// src/models/Product.js
import mongoose from "mongoose";
import Counter from "./Counter.js"; // supports SKU auto-geneartion using the Counter model -assumes a simple counter collection for sequence numbers
import slugify from "slugify";

/**
 * The Product schema
 * - supports variants (size/color), stock per variant & per location
 * - supports SKU auto-generation using a Counter model
 * - text index for search
 * - instance + static helpers for reserving/decrementing stock
 */

const VariantOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Size"
    value: { type: String, required: true }, // e.g. "M"
  },
  { _id: false }
);

const VariantSchema = new mongoose.Schema(
  {
    sku: { type: String }, // optional per-variant SKU override
    title: { type: String }, // e.g. "Red / M"
    options: [VariantOptionSchema], // e.g. [{name: 'Color', value:'Red'}, {name:'Size', value:'M'}]
    price: { type: Number, min: 0 }, // price override for variant (optional)
    compareAtPrice: { type: Number, min: 0 },
    cost: { type: Number, min: 0 }, // internal cost
    barcode: String,
    images: [{ type: String }],
    // stock can be maintained per-variant and per-location (object map)
    stock: { type: Number, default: 0 }, // total across locations
    stockByLocation: {
      // example keys: 'kisumu_cbd', 'kisumu_other', 'other_county'
      type: Map,
      of: Number,
      default: {},
    },
    inStock: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: String,
    width: Number,
    height: Number,
    focalPoint: { x: Number, y: Number }, // optional cropping hints
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },  // who added/owns this product (admin user)
    
    // identifiers
    sku: { type: String, unique: true, index: true }, // auto-generated if missing
    slug: { type: String, unique: true, index: true },

    // core
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: "", trim: true },
    description: { type: String, default: "" }, //you can add maxlength: 1000 -description length max 1000 chars for quality control.

    // categorization
    category: { type: String, index: true },
    subcategory: { type: String, index: true },
    brand: { type: String, index: true },
    tags: [{ type: String, index: true }],

    // pricing
    price: { type: Number, required: true, min: 0 }, // in cents to avoid float precision issues
    currency: { type: String, default: "KES" },
    compareAtPrice: { type: Number, min: 0 }, // strike-through price
    cost: { type: Number, min: 0 }, // internal cost

    // variants (size/color/other)
    hasVariants: { type: Boolean, default: false },
    variants: [VariantSchema],
    
    // inventory (aggregate) - / numeric stock count, This way you can decrement stock when an order is placed.
    //That way, your DB will never allow negative or fractional stock (like -1 or 2.5).
    stock: { type: Number, default: 0 }, // total across variants/locations
    // stock: { 
    // type: Number, 
    // default: 0,
    // min: [0, "Stock cannot be negative"],
    // validate: { 
    //   validator: Number.isInteger, 
    //   message: "Stock must be an integer value" 
    // }

    stockByLocation: {
      // e.g. { "kisumu_cbd": 10, "kisumu_other": 5, "other_county": 0 }
      type: Map,
      of: Number,
      default: {},
    },
    inStock: { type: Boolean, default: true }, // auto-updated below
    allowBackorder: { type: Boolean, default: false }, // allow ordering when out-of-stock

    // media
    images: [ImageSchema],
    thumbnail: String,
    gallery: [{ type: String }],
    //images: [{ type: String }]

    // shipping / physical attributes
    weightKg: Number,
    dimensions: {
      lengthCm: Number,
      widthCm: Number,
      heightCm: Number,
    },
    shippingEligible: { type: Boolean, default: true },
    taxable: { type: Boolean, default: true },
    taxClass: { type: String, default: "standard" },

    // marketing / SEO
    bestseller: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // toggles visibility
    isDraft: { type: Boolean, default: false }, // withheld from store
    seo: {
      title: String,
      description: String,
      canonicalUrl: String,
    },

    // analytics & business metrics
    views: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    // relations
    related: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    reviewsCount: { type: Number, default: 0 }, // if using separate Review model

    // soft delete
    deletedAt: { type: Date, default: null },

    // free-form metadata
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

/* Indexes */
productSchema.index({ name: "text", shortDescription: "text", description: "text", tags: "text" }, { weights: { name: 10, tags: 5, shortDescription: 3 } });

/* Pre-save: slug & sku Auto-generation + inStock sync */
productSchema.pre("save", async function (next) {
  try{
  // slug generation
    if (!this.slug && this.name) {
      const base = slugify(this.name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
      // ensure uniqueness by appending counter if needed
      let slugCandidate = base;
      let suffix = 0;
      // We try a few times to avoid infinite loops
      while (true) {
        // Check for other product with same slug
        // skip checking itself if updating
        // use query that ignores soft-deleted items
        // use short-circuit to avoid heavy loops (reasonable for dev)
        // Note: In heavy-production, move this to a separate unique-slug service
        // or rely on DB unique index and handle duplicate-key errors
        // Here we run quick check:
        // eslint-disable-next-line no-await-in-loop
        const exists = await mongoose.models.Product.findOne({ slug: slugCandidate, _id: { $ne: this._id }, deletedAt: null });
        if (!exists) break;
        suffix += 1;
        slugCandidate = `${base}-${suffix}`;
      }
      this.slug = slugCandidate;
    }
    
    // SKU auto-generation if missing
    if (!this.sku) {
      // atomic counter in Counter collection
      // Counter schema expected: { name: String, seq: Number }
      // If Counter doesn't exist, upsert will create.
      // eslint-disable-next-line no-await-in-loop
      const counter = await Counter.findOneAndUpdate({ name: "product" }, { $inc: { seq: 1 } }, { new: true, upsert: true });
      const year = new Date().getFullYear();
      this.sku = `SKU-${year}-${String(counter.seq).padStart(5, "0")}`;
    }

    // Compute aggregate stock from variants if present
    if (this.hasVariants && Array.isArray(this.variants) && this.variants.length) {
      let total = 0;
      for (const v of this.variants) {
        total += Number(v.stock || 0);
      }
      this.stock = total;
    }
    // keep inStock consistent/synced with quantity/variants
    this.inStock = this.stock > 0 || (this.hasVariants && (this.variants?.some?.(v => v.inStock)));
    next();
  } catch (err) {
    next(err);
  }
});

/* Instance methods */

// decrement stock for single product/variant atomically (preferred)
productSchema.methods.decrementStock = async function ({ variantId = null, qty = 1, location = null, session = null } = {}) {
  // If variantId provided, operate on that variant
  if (variantId) {
    // find variant index
    const v = this.variants.id(variantId);
    if (!v) throw new Error("Variant not found");
    // check availability
    if (!this.allowBackorder) {
      if (location) {
        const locQty = Number(v.stockByLocation.get(location) || 0);
        if (locQty < qty) throw new Error("Not enough stock at location");
        v.stockByLocation.set(location, locQty - qty);
      } else {
        if (v.stock < qty) throw new Error("Not enough stock");
        v.stock -= qty;
      }
    } else {
      // allow backorder -> just decrement negative allowed
      if (location) {
        const locQty = Number(v.stockByLocation.get(location) || 0);
        v.stockByLocation.set(location, locQty - qty);
      } else {
        v.stock -= qty;
      }
    }

    // recompute total product stock
    this.stock = this.variants.reduce((s, x) => s + Number(x.stock || 0), 0);
    this.inStock = this.stock > 0;
    await this.save({ session });
    return this;
  }

  // No variant: operate on root-level stock
  if (!this.allowBackorder && this.stock < qty) {
    throw new Error("Not enough stock");
  }
  if (location) {
    const cur = Number(this.stockByLocation.get(location) || 0);
    this.stockByLocation.set(location, cur - qty);
    // recompute root stock
    const total = Array.from(this.stockByLocation.values()).reduce((a, b) => a + Number(b || 0), 0);
    this.stock = total;
  } else {
    this.stock -= qty;
  }
  this.inStock = this.stock > 0;
  await this.save({ session });
  return this;
};

/**
 * Reserve stock for an order: tries to atomically decrement stock across items.
 * items = [{ productId, variantId?, qty, location? }]
 * Returns: { success: true } or throws Error with message listing failing item(s)
 *
 * Implementation note:
 * - For true atomic multi-document reservations, use MongoDB transactions.
 * - This helper supports an optional session parameter to be used in a transaction.
 */
productSchema.statics.reserveStock = async function (items = [], { session = null } = {}) {
  const Product = mongoose.models.Product;
  const failed = [];
  // process sequentially or in user code wrap in transaction for atomicity
  for (const it of items) {
    const p = await Product.findById(it.productId).session(session);
    if (!p) {
      failed.push({ ...it, reason: "Product not found" });
      continue;
    }
    try {
      await p.decrementStock({ variantId: it.variantId, qty: it.qty, location: it.location, session });
    } catch (err) {
      failed.push({ ...it, reason: err.message });
    }
  }
  if (failed.length) {
    // optionally rollback previous decrements if session not provided (best-effort)
    // In production always call this inside a transaction (session) to auto-rollback
    throw new Error("Reservation failed for some items: " + JSON.stringify(failed));
  }
  return { success: true };
};

/* Static helpers */
productSchema.statics.findBySku = function (sku) {
  return this.findOne({ sku });
};

productSchema.statics.searchText = function (query, { limit = 20, skip = 0 } = {}) {
  return this.find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(limit);
};

/* Virtual: price with tax (example) */
productSchema.virtual("priceWithTax").get(function () {
  // Example simplistic tax calculation — replace with real tax lookup for taxClass
  const taxRate = this.taxable ? 0.16 : 0; // e.g. 16%
  return Number((this.price * (1 + taxRate)).toFixed(2));
});

export default mongoose.model("Product", productSchema);
