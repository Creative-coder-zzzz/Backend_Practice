import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import jwt, { decode } from 'jsonwebtoken'

import { ApiResponse } from '../utils/ApiResponse.js'


const generateAccessAndRefreshTokens = async(userId)=>{
  try{
   const user =  await  User.findById(userId)
   const accessToken = user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()

   user.refreshToken = refreshToken 
  await user.save({validateBeforeSave: false})

  return {accessToken, refreshToken}
  }catch(error){
    throw new ApiError(500, 'something went wrong while generating the tokes')
  }
}




const registerUser = asyncHandler( async(req,res)=> {
//get user details from frontend 
// validation (check whether the filled in data are correct and there are no empty fields)
// check if user already exists : username , email 
// check for images, check for avatar
// upload them to cloudinary 
// create user object - create entry in db 
//remove password and refresh token field from response 
//check for user creation 
//return response

const {fullname, email, username, password}=req.body
 console.log("email: ", email)
 
//  if(fullname === ""){
//  throw new ApiError(400, "Fullname is required")
//  }

//CHECK NO EMPTY FIELDS
if([fullname, email, username, password].some((field)=>field?.trim() === "")){
    throw new ApiError(400, "All fields are Required")
}

//CHECK USER ALREADY EXISTS
const existedUser = await User.findOne({
  $or: [{username}, {email}]
})

if(existedUser) {
  throw  new ApiError(409, "User with email or username already exists")
}

//adding images 
const avatarLocalPath = req.files?.avatar[0]?.path
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
  throw new ApiError(400, "Avatar file is required")
}
//upload it cloudinary
const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
  throw new ApiError(400, "Avatar file is required")
}


//entry on database
const user = await User.create({
  fullname,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email,
  password,
  username: username.toLowerCase()
})


const createdUser = await User.findById(user._id).select(
  "-password -refreshToken "
)

if(!createdUser){
  throw new ApiError(500, "something went worng while registering the user ")
}

return res.status(201).json(
  new ApiResponse(200, createdUser, "User registered successfully")
)
} )


const loginUser = asyncHandler(async(req,res)=>{
  //get data from req body
  //username or email
  //find the user
  //password check 
  //access and refresh token
  //send secure cookie
  //response logged in successfully


  const {email, username, password} = req.body

if(!username || !email){
   if(!username && !email) {
    throw new ApiError(400, "Username or email is required")
  }
}

  const user = await User.findOne({
    $or : [{username}, {email}]
  })

  if(!user){
    throw new ApiError(404, "User does not exist")
  }

 const isPasswordValid = await user.isPasswordCorrect(password)

 
 if(!isPasswordValid){
  throw new ApiError(401, "Invalid user credentials")
 }

 const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

 
 const loggedInUser = await User.findById(user._id)
 .select("-password -refreshToken")

 const options={
 httpOnly: true,
 secure:true
 }

 return res.status(200)
 .cookie("accessToken", accessToken, options)
 .cookie("refreshToken", refreshToken, options)
 .json(
  new ApiResponse(200,{
    user: loggedInUser, accessToken, refreshToken
  }, "user logged in successfully")
 )
})

const logoutUser = asyncHandler (async(req,res)=>{
  //find logged in user
 await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      },
    },
    {
      new: true
    }
  ) 

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User Logged Out SUccessfully"))
})


const refreshAccessToken = asyncHandler(async(req, res)=>{
 try {
  const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
 
  if(!incomingRefreshToken){
   throw new ApiError(401, "Unauthorized Request")
  }
 
  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
 const user = await User.findById(decodedToken?._id)
 
 if (!user){
 throw new ApiError(401, "invalid refresh token")
 }
 
 if(incomingRefreshToken !== user?.refreshToken){
   throw new ApiError(401, "Refresh token is expired or has been used")
 }
 
 const options = {
   httpOnly : true,
   secure: true
 }
 const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
 return res
 .status(200)
 .cookie("accessToken", accessToken)
 .cookie("refreshToken", newrefreshToken, options)
 .json(
   new ApiResponse(
     200,
     {accessToken, refreshToken: newrefreshToken},
     "Access Token refreshed successfully"
   )
 )
 } catch (error) {
  throw new ApiError(401, error?.message ||"invalid refresh token " )
 }
})
export {registerUser, loginUser, logoutUser, refreshAccessToken};