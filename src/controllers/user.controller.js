import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details frontend
  //validation
  //- not empty
  //check user already exist: username and email
  //files is present (images , avatar)
  //upload them to cloudinary, avatar is uploaded or not
  //create user object(for non sequel type) - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  // return res
console.log("whole req=>",req.body);
console.log("req-files=>",req.files);
  const { username, fullname, email, password } = req.body;

  //   if (fullname === "") {
  //     throw new ApiError(400, "Full Name is required");
  //   }

  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already Exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  

  const coverImageLoaclPath = req.files?.coverimage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }
  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLoaclPath);

  if (!avatar) {
    throw new ApiError(400, "Aavatar File is required.");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", //since avatar is checked as it was
    //required but cover Image is optional
    // check /*coverImage?.url || ""*/ is important
    email,
    password,
    username: username.toLowerCase(),
  });
  //check user details is creadted by making db call its foolproof
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Somthing went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User Register Successfully."));
});

export { registerUser };
