import connectDB from './db/db.js'
import dotenv from 'dotenv'
import app from './app.js'
dotenv.config({
    path:'./.env'
})
connectDB()
.then(()=>{
    const port = process.env.PORT || 4000
    app.listen(port)
    console.log(`server started on port ${port}`)
})
.catch((err)=>{
    console.log("mongodb connection error",err)
})