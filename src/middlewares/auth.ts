import UserModel from "@/models/user";
import { formatUserProfile, sendErrorResponse } from "@/utils/helper";
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "@/utils/asyncHandler";

declare global {
  namespace Express {
    export interface Request {
      user: {
        id: string;
        name?: string;
        email: string;
        role: "user" | "author";
        avatar?: string;
        signedUp: boolean;
        authorId?: string;
        books?: string[];
      };
    }
  }
}

export const isAuth = asyncHandler(async (req, res, next) => {
  let authToken = req.cookies.authToken;

  if (!authToken) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      authToken = authHeader.split(" ")[1];
    }
  }

  // send error response if there is no token
  if (!authToken) {
    return sendErrorResponse({
      message: "Unauthorized request!",
      status: 401,
      res,
    });
  }

  // otherwise find out if the token is valid or signed by this same server
  const payload = jwt.verify(authToken, process.env.JWT_SECRET!) as {
    userId: string;
  };

  // if the token is valid find user from the payload
  // if the token is invalid it will throw error which we can handle
  // from inside the error middleware
  const user = await UserModel.findById(payload.userId);
  if (!user) {
    return sendErrorResponse({
      message: "Unauthorized request user not found!",
      status: 401,
      res,
    });
  }

  req.user = formatUserProfile(user);

  next();
});

export const isPurchasedByTheUser = asyncHandler(async (req, res, next) => {
  const user = await UserModel.findOne({
    _id: req.user.id,
    books: req.body.bookId,
  });

  if (!user) {
    return sendErrorResponse({
      res,
      message: "Sorry we didn't found the book inside your library!",
      status: 403,
    });
  }

  next();
});

export const isAuthor: RequestHandler = (req, res, next) => {
  if (req.user.role === "author") {
    next();
  } else {
    return sendErrorResponse({ message: "Invalid request!", res, status: 401 });
  }
};
