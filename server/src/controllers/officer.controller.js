import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as complaintService from '../services/complaint.service.js';

export const getAssignedComplaints = asyncHandler(async (req, res) => {
  const { complaints, page, limit, total } = await complaintService.listAssignedComplaints(
    req.user._id,
    req.query,
  );
  res
    .status(200)
    .json(
      new ApiResponse('Assigned complaints fetched successfully', { complaints, page, limit, total }),
    );
});

export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await complaintService.updateComplaintStatus(
    req.params.id,
    req.user._id,
    req.body,
  );
  res.status(200).json(new ApiResponse('Complaint status updated successfully', { complaint }));
});

export const addResolutionNote = asyncHandler(async (req, res) => {
  const complaint = await complaintService.addResolutionNote(
    req.params.id,
    req.user._id,
    req.body.resolutionNote,
  );
  res.status(200).json(new ApiResponse('Resolution note added successfully', { complaint }));
});
