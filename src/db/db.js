import mongoose from "mongoose"
import {DB_NAME} from '../constant.js'

const connectDB=async()=>{
    try{
     const connectioninstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
     console.log(`mongodb connected !!db host ${connectioninstance.connection.host}`)
    }
    catch(error){
        console.log("mongodb connectionerror",error)
        process.exit(1)
    }
}
export default connectDB