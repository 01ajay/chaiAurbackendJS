import { Router } from "express";
import {
  registerUser,
  userLogin,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserDetail,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//middleware inject upload.field from line no 8 to 19

router.route("/register").post(
  upload.fields([
    { name: "coverimage", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(userLogin);



//secured route 

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-access-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changePassword);
router.route("/current-user").get(verifyJWT,getCurrentUser);

router.route("/update-account").patch(verifyJWT,updateUserDetail);
router.route("/user-avatar").patch(verifyJWT,upload.single("avatar"), updateUserAvatar);
router
  .route("/update-coverimage")
  .patch(verifyJWT,upload.single("coverimage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT,getUserChannelProfile);  //getWatchHistory
router.route("/watch-history").get(verifyJWT,getWatchHistory);

export default router;
