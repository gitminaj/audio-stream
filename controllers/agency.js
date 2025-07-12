import agencyRegister from "../models/agencyRegister.js";

export const register = async (req, res) => {
  console.log("req body", req.body);
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
    } = req.body;

    if (
      !name ||
      !agencyName ||
      !email ||
      !number ||
      !gender ||
      !idProofName ||
      !accountNumber ||
      !IFSC
    ) {
      return res.status(404).json({
        success: false,
        message: "Some of the required fields are missing",
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

export const updateStatus = async (req,res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role } = req.user;

    console.log('user', req.user);
    console.log('role', role);

    if (!(role == 'superadmin')) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: status can be updated by superadmin only",
        })
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be one of: approved, rejected, or pending",
      });
    }

    const data = await agencyRegister.findByIdAndUpdate(id, { status }, {new: true});

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
