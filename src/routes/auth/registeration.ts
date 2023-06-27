import { Router } from "express";

import UserService from "../../services/UserService";
import * as validation from "../../middlewares/validation";

const router = Router();

router.post(
  `/register`,
  validation.validateUsername,
  validation.validateEmail,
  validation.validatePassword,
  validation.validatePasswordMatch,
  async (req, res, next) => {
    try {
      const validationErrors = validation.validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          errors: validationErrors.array().map((error) => {
            return error.msg;
          }),
        });
      }

      const existingEmail = await UserService.findByEmail(req.body.email);
      const existingUsername = await UserService.findByUsername(
        req.body.username
      );
      if (existingEmail || existingUsername) {
        return res.status(400).json({
          errors: [
            `The ${existingEmail ? "email" : "username"} is existing.`,
          ],
        });
      }

      await UserService.createUser(
        req.body.username,
        req.body.email,
        req.body.password
      );
      return res.json({ success: "Successfully registered!" });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
