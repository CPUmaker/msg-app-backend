import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import UserService from "../services/UserService";

export const TokenDecoder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error();
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    const user = await UserService.findById(decode.userId);
    if (!user) {
      throw new Error();
    }
    req.userId = user._id.toString();

    next();
  } catch (err) {
    return res.status(401).json({
      errors: ["Please authenticate"],
    });
  }
};
