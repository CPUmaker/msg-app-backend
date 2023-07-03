import { Router } from "express";
import jwt from "jsonwebtoken";

import { IUser } from "../../models/UserModel";
import UserService from "../../services/UserService";
import * as Auth from "../../middlewares/authentication";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    let user: IUser | null;
    if (req.body.username) {
      user = await UserService.findByUsername(req.body.username);
    } else {
      user = await UserService.findByEmail(req.body.email);
    }
    if (!user) {
      return res.status(401).json({
        error: "The username does not exist",
      });
    }

    const isValid = await user.comparePassword(req.body.password);
    if (!isValid) {
      return res.status(401).json({
        error: "The credential is invalid",
      });
    }

    const token = jwt.sign(
      { userId: user._id?.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "2 days",
      }
    );
    return res.json({ jwt: token });
  } catch (err) {
    return next(err);
  }
});

router.post("/check-valid", Auth.TokenDecoder, async (req, res) => {
  const user = await UserService.findById(req.userId);
  if (!user) {
    return res.status(401).json({
      error: "The credential is invalid",
    });
  }
  return res.json({ success: true });
});

export default router;
