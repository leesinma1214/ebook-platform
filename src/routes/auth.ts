import { Router } from "express";
import { generateAuthLink, verifyAuthToken } from "@/controllers/auth";
import { EmailValidationSchema, validate } from "@/middlewares/validator";

const authRouter = Router();

authRouter.post(
  "/generate-link",
  validate(EmailValidationSchema),
  generateAuthLink
);
authRouter.get("/verify", verifyAuthToken);

export default authRouter;
