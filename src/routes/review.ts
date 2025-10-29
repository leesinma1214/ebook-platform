import { addReview } from "@/controllers/review";
import { isAuth, isPurchasedByTheUser } from "@/middlewares/auth";
import { Router } from "express";
import { newReviewSchema, validate } from "@/middlewares/validator";

const reviewRouter = Router();

reviewRouter.post(
  "/",
  isAuth,
  validate(newReviewSchema),
  isPurchasedByTheUser,
  addReview
);

export default reviewRouter;
