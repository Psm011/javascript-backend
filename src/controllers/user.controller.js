import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadfileoncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { ApiError } from "../utils/ApiErrors.js";
import jwt from "jsonwebtoken"
const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const AccessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { AccessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error.message || "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  if (!fullname || !email || !username || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const findUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (findUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarlocalpath = req.files?.avatar?.[0]?.path;
  const coverimagelocalpath = req.files?.coverimage?.[0]?.path;

  if (!avatarlocalpath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadfileoncloudinary(avatarlocalpath);
  const coverimage = coverimagelocalpath
    ? await uploadfileoncloudinary(coverimagelocalpath)
    : null;

  if (!avatar) {
    throw new ApiError(502, "Avatar upload failed; check Cloudinary credentials");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { AccessToken, refreshToken } = await generateAccessandRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", AccessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          AccessToken,
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
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToen=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookie?.refreshToken||req.header?.refreshToken||req.body?.refreshToken
  if(!refreshToken){
    throw new ApiError(401,"Unauthorized Request")
  }
  try {
    const decodedRefreshToken= await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
     const user=await User.findById(decodedRefreshToken?._id)
     if(!user){
      throw new ApiError(404,"User not found")
     }
     if(incomingRefreshToken!== user?.refreshToken){
      throw new ApiError(401,"Refresh Token is expired")
     }
     const{accessToken,refreshToken}=await generateAccessandRefreshToken(user?._id)
      const options={
        httpOnly:true,
        secure:true
      }
      return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(
        new ApiResponse(
          200,
          {accessToken,refreshToken}
        )
      )
  } catch (error) {
    throw new ApiError(401,error?.message)
  }
})

export { registerUser, loginUser, logoutUser };
