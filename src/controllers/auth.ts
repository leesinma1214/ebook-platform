import { Request, Response, RequestHandler } from "express";
import crypto from "crypto";
import VerificationTokenModel from "@/models/verificationToken";
import UserModel from "@/models/user";
import mail from "@/utils/mail";
import asyncHandler from "@/utils/asyncHandler";
import { sendErrorResponse, formatUserProfile } from "@/utils/helper";
import jwt from "jsonwebtoken";
import { updateAvatarToAws } from "@/utils/fileUpload";
import slugify from "slugify";
import AuthorModel from "@/models/author";

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
    name: user.name || user.email.split("@")[0], // Pass user name
  });

  res.json({ message: "Please check your email for the verification link." });
});

export const verifyAuthToken = asyncHandler(async (req, res) => {
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

  // Mark user as signed up during verification
  user.signedUp = true;
  await user.save();

  const payload = { userId: user._id };

  const authToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15d",
  });

  // Redirect with token in URL so frontend can exchange it for a cookie
  const redirectUrl = `${
    process.env.AUTH_SUCCESS_URL
  }?token=${authToken}&profile=${encodeURIComponent(
    JSON.stringify(formatUserProfile(user))
  )}`;

  if (req.headers.accept?.includes("text/html")) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redirecting...</title>
        </head>
        <body>
          <script>
            window.location.href = ${JSON.stringify(redirectUrl)};
          </script>
          <noscript>
            <a href="${redirectUrl}">Click here to continue</a>
          </noscript>
        </body>
      </html>
    `);
  }

  res.json({
    message: "Verification successful",
    redirectUrl,
    token: authToken,
    profile: formatUserProfile(user),
  });
});

// Add new endpoint for frontend to exchange token for cookie
export const exchangeToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== "string") {
    return sendErrorResponse({
      status: 400,
      message: "Token is required",
      res,
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return sendErrorResponse({
        status: 404,
        message: "User not found",
        res,
      });
    }

    const isDevModeOn = process.env.NODE_ENV === "development";
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: !isDevModeOn,
      sameSite: isDevModeOn ? "strict" : "none",
      expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    });

    res.json({
      message: "Token exchanged successfully",
      profile: formatUserProfile(user),
    });
  } catch (error) {
    return sendErrorResponse({
      status: 401,
      message: "Invalid or expired token",
      res,
    });
  }
});

export const sendProfileInfo: RequestHandler = (req, res) => {
  res.json({
    profile: req.user,
  });
};

export const logout: RequestHandler = (req, res) => {
  const isDevModeOn = process.env.NODE_ENV === "development";
  res
    .clearCookie("authToken", {
      httpOnly: true,
      secure: !isDevModeOn,
      sameSite: isDevModeOn ? "strict" : "none",
      path: "/",
    })
    .send();
};

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await UserModel.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      signedUp: true,
    },
    {
      new: true,
    }
  );

  if (!user)
    return sendErrorResponse({
      res,
      message: "Something went wrong user not found!",
      status: 500,
    });

  // Update author name if user is an author
  if (user.authorId) {
    await AuthorModel.findByIdAndUpdate(user.authorId, {
      name: req.body.name,
    });
  }

  // if there is any file upload them to cloud and update the database
  const file = req.files.avatar;
  if (file && !Array.isArray(file)) {
    const extension =
      file.originalFilename?.split(".").pop()?.toLowerCase() || "png";
    const allowedExtensions = ["png", "jpg", "jpeg", "webp"];

    if (!allowedExtensions.includes(extension)) {
      return sendErrorResponse({
        res,
        message: "Invalid file type. Only PNG, JPG, and WEBP allowed.",
        status: 400,
      });
    }

    const uniqueFileName = `${user._id}-${slugify(req.body.name, {
      lower: true,
      replacement: "-",
    })}.${extension}`;
    user.avatar = await updateAvatarToAws(
      file,
      uniqueFileName,
      user.avatar?.id
    );

    await user.save();
  }

  res.json({ profile: formatUserProfile(user) });
});
