import agencyRegister from "../models/agencyRegister.js";
import host from "../models/host.js";
import crypto from "crypto";

export const register = async (req, res) => {
  console.log("req user", req.user);
  const { id } = req.user;
  try {
    const {
      name,
      agencyName,
      email,
      number,
      gender,
      idProofName,
      accountNumber,
      IFSC,
      agencyId,
    } = req.body;

    if (
      !name ||
      !agencyName ||
      !email ||
      !number ||
      !gender ||
      !idProofName ||
      !accountNumber ||
      !IFSC ||
      !agencyId
    ) {
      return res.status(404).json({
        success: false,
        message: "Some of the required fields are missing",
      });
    }

    const existAgency = await agencyRegister.findOne({ uniqueId: agencyId });

    if (!existAgency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    const alreadyAdded = existAgency.hosts.find(
      (hostId) => hostId.toString() === id.toString()
    );

    if (alreadyAdded) {
      return res.status(400).json({
        success: false,
        message: "You are already a host for this agency",
      });
    }

    const hostIdProofFile = req?.files?.hostIdProofFile[0]?.location || null;
    const hostLogo = req?.files?.hostLogo[0]?.location || null;

    if (!hostIdProofFile || !hostLogo) {
      return res.status(400).json({
        success: false,
        message: "Id proof and logo required",
      });
    }

    const data = await host.create({
      ...req.body,
      hostIdProofFile,
      hostLogo,
      requestedBy: id,
    });

    return res.status(201).json({
      success: true,
      data: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, agencyId } = req.body;
  try {
 if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be one of: approved, rejected, or pending",
      });
    }

    const hostRequest = await host.findById(id);

    if (!hostRequest) {
      return res.status(404).json({
        success: false,
        message: "Host request not found",
      });
    }

    if (status === "approved") {
      const agency = await agencyRegister.findOne({ uniqueId: agencyId });

      if (!agency) {
        return res.status(404).json({
          success: false,
          message: "Agency not found",
        });
      }

      if ( agency.requestedBy.toString() != req.user.id.toString() ) {
        return res.status(401).json({
          success: false,
          message: "Not authorized to update status",
        });
      }

      

      const hostUserId = hostRequest.requestedBy.toString();

      const alreadyExists = agency.hosts.some(
        (hostId) => hostId.toString() === hostUserId
      );

      if (!alreadyExists) {
        agency.hosts.push(hostUserId);
        await agency.save();
      }
    }

    hostRequest.status = status;
    await hostRequest.save();

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: hostRequest,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const getAllAgency = async (req, res) => {
  try {
    const agency = await agencyRegister.find();

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agencys not found ",
      });
    }

    return res.status(200).json({
      success: true,
      data: agency,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const getAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const agency = await agencyRegister.findById(id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found ",
      });
    }

    return res.status(200).json({
      success: true,
      data: agency,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
