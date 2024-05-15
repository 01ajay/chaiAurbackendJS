import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while genrating refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  /*algorithm for user register */
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

  //console.log("whole req=>", req.body);
  //console.log("req-files=>", req.files);
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

  let coverImageLoaclPath = null;

  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverImageLoaclPath = req.files.coverimage[0].path;
  }

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
    coverimage: coverImage?.url || "", //since avatar is checked as it was
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

const userLogin = asyncHandler(async (req, res) => {
  /*algorithm for user login*/
  //1 extract the username or email,password from req
  //2 validate the field for empty
  //3 check user is present or not
  //4 check password matches or not
  //5 access token and refresh token
  //6 send secure cookies

  const { email, username, password } = req.body;

  if (!email || !username) {
    throw new ApiError(400, "username or password is required");
  }

  /*Note - this "User"  is monogo DB but whenever you 
            want to access own method that will be 
            accessible "userPresent"*/

  const userPresent = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!userPresent) {
    throw new ApiError(400, "User doesn't exist");
  }
  const isPasswordValid = await userPresent.isPasswordCorrect(password);
  if (isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const [accessToken, refreshToken] = await generateAccessAndRefreshToken(
    userPresent._id
  );

  const loggedInUser = User.findById(userPresent._id).select(
    "-password -refreshToken"
  );

  //cookiest option object
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .send(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .send(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});
export { registerUser, userLogin };
