// src/controllers/cartController.js
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

/**
 * Get cart: for logged-in user (req.user.id) or by sessionId query param.
 */
export const getCart = async (req, res) => {
  const sessionId = req.query.sessionId;
  const userId = req.user?.id;

  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId }).populate("items.product");
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId }).populate("items.product");
  } else {
    return res.status(400).json({ message: "Provide sessionId for guest or authenticate." });
  }

  if (!cart) return res.json({ items: [], total: 0 });
  const total = cart.items.reduce((s, it) => s + (it.price || 0) * it.quantity, 0);
  res.json({ cart, total });
};

/**
 * Add or update an item.
 * Body: { sessionId?, productId, quantity }
 * If product exists in cart -> increment/replace based on `replace` query flag.
 */
export const addOrUpdateItem = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const sessionId = req.body.sessionId || req.query.sessionId;
  const userId = req.user?.id;

  if (!productId || quantity <= 0) return res.status(400).json({ message: "productId and positive quantity required" });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId });
  } else {
    if (!sessionId) return res.status(400).json({ message: "sessionId required for guest cart" });
    cart = await Cart.findOne({ sessionId });
  }

  if (!cart) {
    cart = new Cart({ user: userId || undefined, sessionId: userId ? undefined : sessionId, items: [] });
  }

  const idx = cart.items.findIndex(i => String(i.product) === String(product._id));
  if (idx >= 0) {
    cart.items[idx].quantity = quantity;
    cart.items[idx].price = product.price;
    cart.items[idx].name = product.name;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0] || null,
      currency: "KES",
    });
  }

  cart.updatedAt = new Date();
  await cart.save();
  res.json(cart);
};

export const removeItem = async (req, res) => {
  const { productId } = req.params;
  const sessionId = req.query.sessionId;
  const userId = req.user?.id;

  let cart = userId ? await Cart.findOne({ user: userId }) : await Cart.findOne({ sessionId });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = cart.items.filter(i => String(i.product) !== String(productId));
  await cart.save();
  res.json(cart);
};

export const clearCart = async (req, res) => {
  const sessionId = req.query.sessionId;
  const userId = req.user?.id;

  let cart = userId ? await Cart.findOne({ user: userId }) : await Cart.findOne({ sessionId });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = [];
  await cart.save();
  res.json({ message: "Cart cleared" });
};

/**
 * Merge guest cart into user cart on login.
 * Body: { sessionId }
 */
export const mergeCart = async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Authenticate to merge cart" });
  if (!sessionId) return res.status(400).json({ message: "sessionId required" });

  const guest = await Cart.findOne({ sessionId });
  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) userCart = new Cart({ user: userId, items: [] });

  if (guest && guest.items.length) {
    // naive merge: add quantities for same product
    for (const it of guest.items) {
      const idx = userCart.items.findIndex(i => String(i.product) === String(it.product));
      if (idx >= 0) {
        userCart.items[idx].quantity += it.quantity;
      } else {
        userCart.items.push(it);
      }
    }
    await userCart.save();
    await guest.deleteOne();
  }

  res.json(userCart);
};
