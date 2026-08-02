import mongoose from 'mongoose';
import { COMPLAINT_STATUS, COMPLAINT_STATUS_VALUES, PRIORITY, PRIORITY_VALUES } from '../constants/complaint.js';

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priority: {
      type: String,
      enum: PRIORITY_VALUES,
      default: PRIORITY.MEDIUM,
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUS_VALUES,
      default: COMPLAINT_STATUS.PENDING,
    },
    images: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ department: 1 });
complaintSchema.index({ createdBy: 1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
