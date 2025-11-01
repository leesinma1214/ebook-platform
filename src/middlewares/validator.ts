import { RequestHandler } from "express";
import { ZodObject, ZodRawShape, z } from "zod";
import { isValidObjectId } from "mongoose";

export const emailValidationSchema = z.object({
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Email is missing!" : "Invalid email type!",
    })
    .email({ message: "Invalid email!" }),
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

const commonBookSchema = {
  uploadMethod: z.enum(["aws", "local"], {
    error: (issue) =>
      issue.input === undefined
        ? "Upload method is missing!"
        : "uploadMethod needs to be either aws or local",
  }),
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
          : "Invalid Description!",
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
};

const fileInfo = z
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
  );

export const newBookSchema = z.object({
  ...commonBookSchema,
  fileInfo,
});

export const updateBookSchema = z.object({
  ...commonBookSchema,
  slug: z
    .string({
      message: "Invalid slug!",
    })
    .trim(),
  fileInfo: fileInfo.optional(),
});

export const newReviewSchema = z.object({
  rating: z
    .number({
      error: (issue) =>
        issue.input === undefined ? "Rating is missing!" : "Invalid rating!",
    })
    .nonnegative("Rating must be within 1 to 5.")
    .min(1, "Minimum rating should be 1")
    .max(5, "Maximum rating should be 5"),
  content: z
    .string({
      error: (issue) => "Invalid content!",
    })
    .optional(),
  bookId: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Book id is missing!" : "Invalid book id!",
    })
    .transform((arg, ctx) => {
      if (!isValidObjectId(arg)) {
        ctx.addIssue({ code: "custom", message: "Invalid book id!" });
        return z.NEVER;
      }

      return arg;
    }),
});

export const historyValidationSchema = z.object({
  bookId: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Book id is missing!" : "Invalid book id!",
    })
    .transform((arg, ctx) => {
      if (!isValidObjectId(arg)) {
        ctx.addIssue({ code: "custom", message: "Invalid book id!" });
        return z.NEVER;
      }

      return arg;
    }),
  lastLocation: z
    .string({
      error: (issue) => "Invalid last location!",
    })
    .trim()
    .optional(),
  highlights: z
    .array(
      z.object({
        selection: z
          .string({
            error: (issue) =>
              issue.input === undefined
                ? "Highlight selection is missing!"
                : "Invalid Highlight selection!",
          })
          .trim(),
        fill: z
          .string({
            error: (issue) =>
              issue.input === undefined
                ? "Highlight fill is missing!"
                : "Invalid Highlight fill!",
          })
          .trim(),
      })
    )
    .optional(),
  remove: z.boolean({
    error: (issue) =>
      issue.input === undefined
        ? "Remove is missing!"
        : "remove must be a boolean value!",
  }),
});

export const validate = <T extends ZodRawShape>(
  schema: ZodObject<T>
): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (result.success) {
      req.body = result.data;
      next();
    } else {
      // Format all errors as an object
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".") || "general";
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });

      return res.status(422).json({ errors });
    }
  };
};

//  = [{ product: idOf the product, count: how many products that our users wants to purchase }]

export const cartItemsSchema = z.object({
  items: z.array(
    z.object({
      product: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Product id is missing!"
              : "Invalid product id!",
        })
        .transform((arg, ctx) => {
          if (!isValidObjectId(arg)) {
            ctx.addIssue({ code: "custom", message: "Invalid product id!" });
            return z.NEVER;
          }

          return arg;
        }),
      quantity: z.number({
          error: (issue) =>
            issue.input === undefined
              ? "Quantity is missing!"
              : "Quantity must be number!",
        })
    })
  ),
});
