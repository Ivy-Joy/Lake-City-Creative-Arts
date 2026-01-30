//Mongoose with refresh token schema/storage and userId auto-generation
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import crypto from "crypto"
import Counter from "./Counter.js";

const AddressSchema = new mongoose.Schema({
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, required: true, trim: true, default: "Kenya" },
}, { _id: false });

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  userAgent: String, // optional
  ip: String, // optional
  expiresAt: Date,
});

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true }, // e.g., USR-2025-0001
    firstName: { type: String, required: true, trim:true },
    lastName: { type: String, required: true, trim:true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      // optional: simple email validation
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    //Phone validation uses E.164 format (+2547...for Kenya, works globally)
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, //allow users without phone
      match: [/^\+?[1-9]\d{6,14}$/, "Please enter a valid phone number"],
    },
    passwordHash: { type: String, required: true, minlength: 8, select: false },
    isVerified: { type: Boolean, default: false },

    //verification fields
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },

    //Roles (multi-role support) //array of strings if later want to support multiple roles
    roles: { 
      type: [String], 
      enum: ["user", "admin"], 
      default: ["user"],
    },

    //Addresses - are embedded subdocuments so a user can have multiple shipping addresses.
    addresses: [AddressSchema],

    //lastLogin, failedLoginAttempts, lockUntil - help with brute-force protection and login tracking
    //Account Security
    failedLoginAttempts: {type:Number, default:0},
    lockUntil:{type:Date},

    //Session + tracking
    lastLogin: {type:Date},
    refreshTokens: [RefreshTokenSchema],
    metadata: {
      browser: String,
      os: String,
      ip:String,
    }, //metadata can store device/browser/IP for analytics or fraud prevention

    // Terms & conditions
    acceptedTerms: { type: Boolean, required: true, default: false },
    acceptedAt: { type: Date },

  },
  { timestamps: true }
);

// helper to hash refresh token for storage
userSchema.statics.hashToken = function (token) {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Hide sensitive fields like password by default when sending JSON
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.passwordHash;
    delete ret.refreshTokens; //optional
    return ret;
  }
});

// Hash password before save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Auto-generate userId using Counter
userSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "user" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const year = new Date().getFullYear();
    this.userId = `USR-${year}-${String(counter.seq).padStart(4, "0")}`;
  }

  //Auto-set acceptedAt timestamp if acceptedTerms is true and was modified
  if (this.isModified('acceptedTerms') && this.acceptedTerms ===true) {
    this.acceptedAt = new Date();
  }

  next();
});

//Compare passwords. userSchema.methods.matchPassword to check for missing hash and throw an informative error
userSchema.methods.matchPassword = async function (entered) {
  if (!this.passwordHash) {
    // better than letting bcrypt throw "Illegal arguments" — clearer message
    throw new Error("No password hash available on user record (did you select it?)");
  }
  return bcrypt.compare(entered, this.passwordHash);
};

export default mongoose.model('User', userSchema);
