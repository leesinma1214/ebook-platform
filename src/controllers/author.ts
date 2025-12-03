import { RequestHandler } from "express";
import AuthorModel from "@/models/author";
import { BookDoc } from "@/models/book";
import UserModel from "@/models/user";
import asyncHandler from "@/utils/asyncHandler";
import { formatUserProfile, sendErrorResponse } from "@/utils/helper";
import slugify from "slugify";

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
      status: "dummy",
    })),
  });
});
