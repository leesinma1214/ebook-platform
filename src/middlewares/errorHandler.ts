import { ErrorRequestHandler } from "express";
import { JsonWebTokenError } from "jsonwebtoken";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      error: err.message,
    });
  }
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
};

export default errorHandler;
