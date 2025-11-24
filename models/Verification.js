// models/Verification.js
const mongoose = require('mongoose');

// Helper function to generate requestId
const generateRequestId = (district, taluk) => {
  const now = new Date();

  const d = district?.[0]?.toUpperCase() || "X";
  const t = taluk?.[0]?.toUpperCase() || "X";

  const yy = String(now.getFullYear()).slice(-2);             // last 2 digits of year
  const HH = String(now.getHours()).padStart(2, "0");         // hour (00–23)
  const MM = String(now.getMinutes()).padStart(2, "0");       // minute (00–59)

  const rnd4 = Math.floor(1000 + Math.random() * 9000);       // random 4 digits

  return `OR${d}${t}${yy}${HH}${MM}${rnd4}`;
};


const verificationSchema = new mongoose.Schema({
    requestId: { 
    type: String, 
    unique: true,
    required: true,
    default: generateRequestId
  },
  userId: { type: String, required: true },
  cropId: { type: String, required: true },
  cropName: { type: String, required: true },
  fullName: String,
  phone: String,
  village: String,
  taluk: String,
  district: String,
  quantity: String,
  variety: String,
  moisture: String,
  willDry: String,
  
  // Photos with individual approval status
  photos: [{
    url: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
  }],
  
  // Location - locationType is OPTIONAL now, set by admin later
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    locationType: { 
      type: String, 
      enum: ['farm', 'village'], 
      required: false
    }
  },
  
  // Overall verification status
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  
  // 🔄 CHANGED: Rejection reason with predefined options
  rejectionReason: { 
  type: String,
  enum: [
    'poor_photo_quality',
    'face_not_visible',
    'incorrect_location',
    'insufficient_photos',
    'duplicate_request',
    'crop_mismatch',
    'fake_or_manipulated',
    'incomplete_information',
    'suspicious_activity',
    'photo_too_dark',
    'photo_not_clear',
    'photo_not_focused',
    'partial_crop_visible',
    'camera_angle_incorrect',
    'photo_contains_obstructions',
    'wrong_crop_uploaded',
    'crop_stage_mismatch',
    'crop_area_not_clear',
    'crop_not_identifiable',
    'other'
  ]
},
  
  // 🆕 ADDED: Optional additional notes for rejection (if reason is 'other' or needs explanation)
  rejectionNotes: { type: String },
  
  // Review metadata
  reviewedAt: { type: Date },
  reviewedBy: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
verificationSchema.index({ location: '2dsphere' });
verificationSchema.index({ userId: 1 });
verificationSchema.index({ cropId: 1 });
verificationSchema.index({ status: 1 });
verificationSchema.index({ requestId: 1 });

// Update timestamp before saving
verificationSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Only generate requestId for new documents
  if (this.isNew && !this.requestId) {
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      const newRequestId = generateRequestId();
      const existing = await mongoose.model('Verification').findOne({ requestId: newRequestId });
      if (!existing) {
        this.requestId = newRequestId;
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return next(new Error('Failed to generate unique requestId'));
    }
  }
  
  next();
});

module.exports = mongoose.model('Verification', verificationSchema);