import { RequestHandler } from "express";
import AuthorModel from "@/models/author";
import { BookDoc } from "@/models/book";
import UserModel from "@/models/user";
import asyncHandler from "@/utils/asyncHandler";
import { formatUserProfile, sendErrorResponse } from "@/utils/helper";
import slugify from "slugify";
import jwt from "jsonwebtoken";

export const registerAuthor = asyncHandler(async (req, res) => {
  const { body, user } = req;
  if (!user.signedUp) {
    return sendErrorResponse({
      message: "User must be signed up before registering as author!",
      status: 401,
      res,
    });
  }

  const newAuthor = new AuthorModel({
    name: body.name,
    about: body.about,
    userId: user.id,
    socialLinks: body.socialLinks,
  });

  const uniqueSlug = slugify(`${newAuthor.name} ${newAuthor._id}`, {
    lower: true,
    replacement: "-",
  });

  newAuthor.slug = uniqueSlug;
  await newAuthor.save();

  const updatedUser = await UserModel.findByIdAndUpdate(
    user.id,
    {
      role: "author",
      authorId: newAuthor._id,
    },
    { new: true }
  );

  let userResult;
  if (updatedUser) {
    userResult = formatUserProfile(updatedUser);
  }

  res.json({
    message: "Thanks for registering as an author.",
    user: userResult,
  });
});

export const updateAuthor = asyncHandler(async (req, res) => {
  const { body, user } = req;

  await AuthorModel.findByIdAndUpdate(user.authorId, {
    name: body.name,
    about: body.about,
    socialLinks: body.socialLinks,
  });

  res.json({ message: "Your details updated successfully." });
});

export const getAuthorDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const author = await AuthorModel.findById(id).populate<{ books: BookDoc[] }>(
    "books"
  );
  if (!author)
    return sendErrorResponse({
      res,
      message: "Author not found!",
      status: 404,
    });

  res.json({
    id: author._id,
    name: author.name,
    about: author.about,
    socialLinks: author.socialLinks,
    books: author.books?.map((book) => {
      return {
        id: book._id?.toString(),
        title: book.title,
        slug: book.slug,
        genre: book.genre,
        price: {
          mrp: (book.price.mrp / 100).toFixed(2),
          sale: (book.price.sale / 100).toFixed(2),
        },
        cover: book.cover?.url,
        rating: book.averageRating?.toFixed(1),
      };
    }),
  });
});

export const getBooks = asyncHandler(async (req, res) => {
  const { authorId } = req.params;

  const author = await AuthorModel.findById(authorId).populate<{
    books: BookDoc[];
  }>("books");

  if (!author)
    return sendErrorResponse({
      message: "Unauthorized request!",
      res,
      status: 403,
    });

  res.json({
    books: author.books.map((book) => ({
      id: book._id?.toString(),
      title: book.title,
      slug: book.slug,
      status: book.status,
    })),
  });
});

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

    // Fixed cookie settings
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true, // Always use secure in production, for dev use localhost over HTTP
      sameSite: isDevModeOn ? "lax" : "none", // Changed from "strict" to "lax"
      expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      path: "/",
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

export const logout: RequestHandler = (req, res) => {
  const isDevModeOn = process.env.NODE_ENV === "development";
  res
    .clearCookie("authToken", {
      httpOnly: true,
      secure: true, // Match the secure setting
      sameSite: isDevModeOn ? "lax" : "none", // Match the sameSite setting
      path: "/",
    })
    .send();
};
