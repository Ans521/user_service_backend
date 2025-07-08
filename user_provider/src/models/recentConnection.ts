import mongoose from "mongoose";

const recentConnectionSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactType: {
    type: String,
    enum: ["whatsapp", "phone", 'message'],
    required: true
  },
  contactedAt: {
    type: Date,
    default: Date.now
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String,
    enum : ["yes", "no"],
    default: null
}
});

export const RecentConnection = mongoose.model("RecentConnection", recentConnectionSchema);
