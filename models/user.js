import mongoose from 'mongoose'
const Schema = mongoose.Schema

const addressSchema = new mongoose.Schema({
  address1: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
})

const communicationSchema = new mongoose.Schema({
  language: { type: String, required: true },
  proficiency: {
    type: String,
    enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
    required: true,
  },
})
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
      default:
        'https://cdn.landesa.org/wp-content/uploads/default-user-image.png',
    },
    slug: {
      type: String,
      required: true,
    },
    wallet: {
      type: Number,
      default: 0,
    },
    secretToken: {
      type: String,
    },
    role: { type: Schema.Types.ObjectId, ref: 'Role' },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    lastPasswordResetAt: { type: Date, required: false },
    profile: {
      phoneNumber: { type: String },
      coverPhoto: { type: String },
      bio: { type: String },
      website: { type: String },
      steam: {
        steamID: { type: String, unique: true, sparse: true },
        partnerID: { type: String, unique: true, sparse: true },
        steamURL: { type: String, unique: true, sparse: true },
        steamTradeURL: {
          type: String,
          unique: true,
          sparse: false,
        },
        lastItemRetrieval: { type: Date },
        steamInventory: {
          type: Object,
        },
      },
      socialMedia: {
        facebook: { type: String },
        twitter: { type: String },
        instagram: { type: String },
        youtube: { type: String },
        twitch: { type: String },
      },
      isVerified: { type: Boolean, required: false },
      communication: [communicationSchema],
    },
    // userFeedback: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' }],
    shippingAddresses: [{ type: addressSchema }],
  },
  { timestamps: true }
)

export const UserModel = mongoose.model('User', userSchema)
