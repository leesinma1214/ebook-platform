import { Router } from "express";
import { generateAuthLink } from "@/controllers/auth";
import { EmailValidationSchema, validate } from "@/middlewares/validator";

const authRouter = Router();

authRouter.post(
  "/generate-link",
  validate(EmailValidationSchema),
  generateAuthLink
);

export default authRouter;
