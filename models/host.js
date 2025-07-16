import mongoose from "mongoose";

const hostSchema = new mongoose.Schema(
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
            required: true,
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
        requestedBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Auth',
            required: true
        },
        agencyId:{
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const hostModel = new mongoose.model('host', hostSchema);
export default hostModel;