import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as complaintService from '../services/complaint.service.js';

export const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.createComplaint(req.body, req.files, req.user);
  res.status(201).json(new ApiResponse('Complaint submitted successfully', { complaint }));
});

export const getComplaints = asyncHandler(async (req, res) => {
  const { complaints, page, limit, total } = await complaintService.listComplaints(
    req.user,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse('Complaints fetched successfully', { complaints, page, limit, total }));
});

export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await complaintService.getComplaintById(req.params.id, req.user);
  res.status(200).json(new ApiResponse('Complaint fetched successfully', { complaint }));
});

export const trackComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.trackComplaint(req.params.complaintId, req.user);
  res.status(200).json(new ApiResponse('Complaint fetched successfully', { complaint }));
});

export const getComplaintTimeline = asyncHandler(async (req, res) => {
  const timeline = await complaintService.getComplaintTimeline(req.params.id, req.user);
  res.status(200).json(new ApiResponse('Complaint timeline fetched successfully', { timeline }));
});

export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.updateComplaint(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse('Complaint updated successfully', { complaint }));
});

export const deleteComplaint = asyncHandler(async (req, res) => {
  await complaintService.deleteComplaint(req.params.id, req.user);
  res.status(200).json(new ApiResponse('Complaint deleted successfully'));
});
