import mongoose from 'mongoose';

const complaintTimelineSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    previousStatus: {
      type: String,
      default: null,
    },
    currentStatus: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  // Timeline entries are an immutable audit trail, so there is no updatedAt.
  { timestamps: { createdAt: true, updatedAt: false } },
);

complaintTimelineSchema.index({ complaint: 1, createdAt: 1 });

const ComplaintTimeline = mongoose.model('ComplaintTimeline', complaintTimelineSchema);

export default ComplaintTimeline;
