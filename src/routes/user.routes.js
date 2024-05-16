import { Router } from "express";
import { registerUser,userLogin,logoutUser,refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

//middleware inject upload.field from line no 8 to 19

router.route("/register").post(
  upload.fields([
    { name: "coverimage", maxCount: 1 },
    { name: "avatar", maxCount: 1 }
    
  ]),
  registerUser
);
 router.route("/login").post(userLogin);


 router.route("/logout").post(verifyJWT,logoutUser);

 router.route("/refreshAccessToken").post(refreshAccessToken);
export default router;
