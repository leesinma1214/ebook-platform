import { addReview } from "@/controllers/review";
import { isAuth } from "@/middlewares/auth";
import { Router } from "express";
import { newReviewSchema, validate } from "@/middlewares/validator";

const reviewRouter = Router();

reviewRouter.post(
  "/add",
  isAuth,
  // TODO: Apply middleware to find book purchase.
  validate(newReviewSchema),
  addReview
);

export default reviewRouter;