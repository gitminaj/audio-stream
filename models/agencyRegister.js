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
        },
        agencyLogo:{
            type: String,
        },
        accountNumber:{
            type: String,
            required: true
        },
        IFSC:{
            type: String,
            required: true
        },
        status:{
            type: String,
            required: true,
            enum:['approved', 'rejected', 'pending'],
            default: 'pending'
        },
        approvedBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'superAdmin'
        }
    },
    {
        timestamps: true
    }
);

const agencyRegisterModel = new mongoose.model('agencyRegister', agencyRegisterSchema);
export default agencyRegisterModel;