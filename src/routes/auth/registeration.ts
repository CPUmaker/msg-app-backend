import { Router } from "express";
import crypto from "crypto";

import UserService from "../../services/UserService";
import * as validation from "../../middlewares/validation";

const router = Router();

router.post(
  `/register`,
  validation.validateEmail,
  validation.validatePassword,
  async (req, res, next) => {
    try {
      const validationErrors = validation.validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          error: validationErrors.array({ onlyFirstError: true })[0].msg,
        });
      }

      const existingEmail = await UserService.findByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({
          error: "The email is existing.",
        });
      }

      await UserService.createUser(
        `user_${crypto.randomBytes(8).toString("hex")}`,
        req.body.email,
        req.body.password
      );
      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
