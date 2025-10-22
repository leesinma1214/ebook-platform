import { Request, Response, RequestHandler } from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import VerificationTokenModel from "@/models/verificationToken";
import UserModel from "@/models/user";
import mail from "@/utils/mail";
import asyncHandler from "@/utils/asyncHandler";
import { sendErrorResponse } from "@/utils/helper";

export const generateAuthLink = asyncHandler(async (req, res) => {
  // Generate authentication link
  // And send that link to the users email address

  /* 1. Generate Unique token for every users.
    2. Store that token securely inside the database
    so that we can validate it in the future.
    3. Create a link which include that secure token and user information.
    4. Send that link to users email address.
    5. Notify user to look inside the email to get login link.*/

  const { email } = req.body;
  let user = await UserModel.findOne({ email });
  if (!user) {
    // if no user found then create a new user.
    user = await UserModel.create({ email });
  }

  const userId = user._id.toString();

  // If the token for this user already exists, delete it.
  await VerificationTokenModel.findOneAndDelete({ userId });

  const randomToken = crypto.randomBytes(36).toString("hex");

  await VerificationTokenModel.create<{ userId: string }>({
    userId,
    token: randomToken,
  });

  const link = `${process.env.VERIFICATION_LINK}?token=${randomToken}&userId=${userId}`;

  await mail.sendVerificationMail({
    link,
    to: user.email,
  });

  res.json({ message: "Please check your email for the verification link." });
});

export const verifyAuthToken: RequestHandler = async (req, res) => {
  const { token, userId } = req.query;

  if (typeof token !== "string" || typeof userId !== "string") {
    return sendErrorResponse({
      status: 403,
      message: "Invalid request!",
      res,
    });
  }

  const verificationToken = await VerificationTokenModel.findOne({ userId });
  if (!verificationToken || !verificationToken.compare(token)) {
    return sendErrorResponse({
      status: 403,
      message: "Invalid request, token mismatch!",
      res,
    });
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return sendErrorResponse({
      status: 500,
      message: "Something went wrong, user not found!",
      res,
    });
  }

  await VerificationTokenModel.findByIdAndDelete(verificationToken._id);

  // TODO: authentication

  res.json({});
};