import { Router } from "express";

import registerationRouter from "./registeration";
import loginRouter from "./login";

const router = Router();

router.use(registerationRouter);
router.use(loginRouter);

export default router;