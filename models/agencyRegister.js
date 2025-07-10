import mongoose from "mongoose";

const agencyRegisterSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true
        },
        agencyName:{
            type: String,
            required: true
        },
        appID:{
            type: String,
            
        },
        email:{
            type: String,
            required: true,
            unique: true
        },
        number:{
            type: String,
            requied: true,
        },
        gender:{
            type: String,
            enum: ['Male','Female','Other'],
            required: true
        },
        idProofName:{
            type: String,
            required: true
        },
        agencyIdProofFile:{
            type: String,
            required: true
        },
        agencyLogo:{
            type: String,
            required: true
        },
        accountNumber:{
            type: String,
            required: true
        },
        IFSC:{
            type: String,
            required: true
        }
    }
);

const agencyRegisterModel = new mongoose.model('agencyRegister', agencyRegisterSchema);
export default agencyRegisterModel;