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

export const newBookSchema = z.object({
  title: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Title is missing!" : "Invalid title!",
    })
    .trim(),
  description: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Description is missing!"
          : "Invalid description!",
    })
    .trim(),
  language: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Language is missing!"
          : "Invalid language!",
    })
    .trim(),
  publishedAt: z.coerce.date({
    error: (issue) =>
      issue.input === undefined
        ? "Publish date is missing!"
        : "Invalid publish date!",
  }),
  publicationName: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Publication name is missing!"
          : "Invalid publication name!",
    })
    .trim(),
  genre: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Genre is missing!" : "Invalid genre!",
    })
    .trim(),
  price: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Price is missing!" : "Invalid price!",
    })
    .transform((value, ctx) => {
      try {
        return JSON.parse(value);
      } catch (error) {
        ctx.addIssue({ code: "custom", message: "Invalid Price Data!" });
        return z.NEVER;
      }
    })
    .pipe(
      z.object({
        mrp: z
          .number({
            error: (issue) =>
              issue.input === undefined
                ? "MRP is missing!"
                : "Invalid mrp price!",
          })
          .nonnegative("Invalid mrp!"),
        sale: z
          .number({
            error: (issue) =>
              issue.input === undefined
                ? "Sale price is missing!"
                : "Invalid sale price!",
          })
          .nonnegative("Invalid sale price!"),
      })
    )
    // if the validator function returns false the error will be thrown
    .refine(
      (price) => price.sale <= price.mrp,
      "Sale price should be less then mrp!"
    ),
  fileInfo: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "File info is missing!"
          : "Invalid file info!",
    })
    .transform((value, ctx) => {
      try {
        return JSON.parse(value);
      } catch (error) {
        ctx.addIssue({ code: "custom", message: "Invalid File Info!" });
        return z.NEVER;
      }
    })
    .pipe(
      z.object({
        name: z
          .string({
            error: (issue) =>
              issue.input === undefined
                ? "fileInfo.name is missing!"
                : "Invalid fileInfo.name!",
          })
          .trim(),
        type: z
          .string({
            error: (issue) =>
              issue.input === undefined
                ? "fileInfo.type is missing!"
                : "Invalid fileInfo.type!",
          })
          .trim(),
        size: z
          .number({
            error: (issue) =>
              issue.input === undefined
                ? "fileInfo.size is missing!"
                : "Invalid fileInfo.size!",
          })
          .nonnegative("Invalid fileInfo.size!"),
      })
    ),
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
