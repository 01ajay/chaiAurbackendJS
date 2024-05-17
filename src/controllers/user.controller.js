import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { json } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

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
  console.log("req.body", req.body);
  const { email, username, password } = req.body;

  if (!(email || username)) {
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
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    userPresent._id
  );

  // console.log("token obj=>",accessToken,refreshToken);

  const loggedInUser = await User.findById(userPresent._id).select(
    "-password -refreshToken"
  );

  //cookies option object
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          loggedInUser,
          accessToken,
          refreshToken,
        },

        "User logged in successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
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
    .status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshTokenReq = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshTokenReq) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const refreshDecode = jwt.verify(
      refreshTokenReq,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(refreshDecode._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (refreshTokenReq != user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or either used.");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "error while generating refresh token"
    );
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successful"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current User"));
});

const updateUserDetail = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }
  //update the user detail in DB
  let updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    { new: true } // if true, return the modified document rather than the original
  ).select("-password -refershToken");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "Account details updated successfully"
      )
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const newLocalPath = req.file?.path;

  if (!newLocalPath) {
    throw new ApiError(400, "path is not available");
  }

  const newAvatar = await uploadCloudinary(newLocalPath);

  if (!newAvatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = awaitUser
    .findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          avatar: newAvatar.url,
        },
      },
      { new: true }
    )
    .select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: user }, "Avatar is updated successfully")
    );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const newLocalPath = req.file?.path;

  if (!newLocalPath) {
    throw new ApiError(400, "path is not available");
  }

  const newUserCoverImage = await uploadCloudinary(newLocalPath);

  if (!newUserCoverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = awaitUser
    .findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          coverimage: newUserCoverImage.url,
        },
      },
      { new: true }
    )
    .select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: user },
        "Cover image is updated successfully"
      )
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  //assume here useranme getting in params

  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "User Name is missing");
  }

  const chanel = await User.aggregate([
    {
      //stage 1 - find the user using user name
      $match: {
        username: username.toLowerCase(),
      },
    },

    //stage 2 - subscriber
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    //stage 3, subscribed  to
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubcribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullname: 1,
        avatar: 1,
        coverimage: 1,
        subscriberCount: 1,
        channelSubcribedToCount: 1,
        isSubscribed: 1,
        email: 1,
      },
    },
  ]);

  if (!chanel?.length) {
    throw new ApiError(404, "Channel doesn't exists");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, chanel[0], "Channel fetched sucessfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistroy",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,

                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner:{ $first: "$owner",}
             
            },
          },
        ],
      },
    },
  ]);      

  return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch fetched history successfully"));
});

export {
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
};
