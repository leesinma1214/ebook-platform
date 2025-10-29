import ReviewModel from "@/models/review";
import asyncHandler from "../utils/asyncHandler";

export const addReview = asyncHandler(async (req, res) => {
  const { bookId, rating, content } = req.body;

  await ReviewModel.findOneAndUpdate(
    { book: bookId, user: req.user.id },
    { content, rating },
    { upsert: true }
  );

  res.json({
    message: "Review updated.",
  });
});
