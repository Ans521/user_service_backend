import jwt from "jsonwebtoken";
import { constrainedMemory } from "process";
const secretKey = '1n1b484n39886ni124114inai';

const verifyToken = (req: any, res: any, next: any) => {
  const authToken: any = req.headers.authorization;
  let token : any = authToken?.split(" ")[1];
  console.log("tken", token);
  console.log("authToken", authToken);

  if(req.originalUrl.includes("get-all-category") && !token){
      req.user = {role : "user"}; // creating temp id for signing user
      console.log("temp id created for get-all-category api")
      return next();
  }


  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  console.log("token", token);
  try {
    console.log("secretKey")
    const decoded = jwt.verify(token, secretKey);
    console.log("decoded", decoded)
    req.user = decoded
    console.log("req.user", req.user)
    next()
  } catch (err: any) {
    console.log("JWT Error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default verifyToken;

// const getUserId = (req : any) => {
//     const {token } = req.cookies

//     return new Promise((resolve : any, reject : any)=>{
//         jwt.verify(token, secretKey, (err : any, user : any)=>{
//             if(err){

//             }
//             resolve(user.id)
//         })
//     })
// }