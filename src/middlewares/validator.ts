import { RequestHandler } from "express";
import { ZodRawShape, ZodType, z } from "zod";

export const emailValidationSchema = z.object({
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Email is missing!" : "Invalid email type!",
    })
    .email("Invalid email!"),
});

export const newUserSchema = z.object({
  name: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Name is missing!" : "Invalid name!",
    })
    .min(3, "Name must be 3 characters long!")
    .trim(),
});

export const newAuthorSchema = z.object({
  name: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Name is missing!" : "Invalid name!",
    })
    .trim()
    .min(3, "Invalid name"),
  about: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "About is missing!" : "Invalid about!",
    })
    .trim()
    .min(100, "Please write at least 100 characters about yourself!"),
  socialLinks: z
    .array(z.url({ message: "Social links can only be list of valid URLs!" }))
    .optional(),
});

export const validate = <T extends unknown>(
  schema: ZodType<T>
): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (result.success) {
      req.body = result.data;
      next();
    } else {
      const errors = result.error.flatten().fieldErrors;
      return res.status(422).json({ errors });
    }
  };
};
