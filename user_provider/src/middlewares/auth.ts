import jwt from "jsonwebtoken";
import phoneNumber from "../models/phone";
const secretKey = 'bdaic193cakjnc';


const isUserAuthenticated = async (req : any, res : any, next : any) => {
    
       const {token} = req.cookies;
       if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
        }
        try{
            const decoded = jwt.verify(token, secretKey) as {phoneNo : String};
            if(!decoded.phoneNo){
                res.status(404).json({message :  "some unexpected error occur"})
            }
            const user = await phoneNumber.findOne({phoneNumber : decoded.phoneNo})

            if(!user){
                return res.status(404).json({ message: "User not found" });
            }
            req.user = user;
            next()
    } catch (err) {
        res.status(500).json({message : "not authenticated"});
    }
}

export default isUserAuthenticated;


const getUserId = (req : any) => {
    const {token } = req.cookies

    return new Promise((resolve : any, reject : any)=>{
        jwt.verify(token, secretKey, (err : any, user : any)=>{
            if(err){

            }
            resolve(user.id)
        })
    })
}