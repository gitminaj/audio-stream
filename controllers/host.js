import host from "../models/host.js";
import crypto from 'crypto'

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
      agencyId
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

    const existingAgency = await agencyRegister.findOne({ email });

  if (existingAgency) {
      return res.status(400).json({
        success: false,
        message: "Agency already exist with this email",
      });
    }

    const agencyIdProofFile =
      req?.files?.agencyIdProofFile[0]?.location || null;
    const agencyLogo = req?.files?.agencyLogo[0]?.location || null;

    if (!agencyIdProofFile || !agencyLogo) {
      return res.status(400).json({
        success: false,
        message: "Id proof file and logo required",
      });
    }

    const data = await agencyRegister.create({
      ...req.body,
      agencyIdProofFile,
      agencyLogo,
      requestedBy: id
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

const generateUniqueId = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); 
};

export const updateStatus = async (req,res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be one of: approved, rejected, or pending",
      });
    }

    let updateData = { status };

    if (status === "approved") {
      let uniqueId;
      let isUnique = false;

      while (!isUnique) {
        uniqueId = generateUniqueId();
        const exists = await agencyRegister.findOne({ uniqueId });
        if (!exists) {
          isUnique = true;
        }
      }

      updateData.uniqueId = uniqueId; 
    }

    const data = await agencyRegister.findByIdAndUpdate(id, updateData, {new: true});

    return res.status(201).json({
        success: true,
        message: 'status updated successfully',
        data
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const getAllAgency = async (req, res) =>{
  try {
    const agency = await agencyRegister.find();
 
    if(!agency){
      return res.status(404).json({
       success: false,
       message: 'Agencys not found '
     });
    }

    return res.status(200).json({
     success: true,
     data: agency
    });

  } catch (err) {
     return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

export const getAgency = async (req, res) =>{
  try {
    const { id } = req.params;
    const agency = await agencyRegister.findById(id);
 
    if(!agency){
      return res.status(404).json({
       success: false,
       message: 'Agency not found '
     });
    }

    return res.status(200).json({
     success: true,
     data: agency
    });

  } catch (err) {
     return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
