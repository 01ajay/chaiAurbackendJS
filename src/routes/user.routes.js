import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

//middleware inject upload.field from line no 8 to 19

router.route("/register").post(
  upload.fields([
    { name: "coverimage", maxCount: 1 },
    { name: "avatar", maxCount: 1 }
    
  ]),
  registerUser
);

export default router;
