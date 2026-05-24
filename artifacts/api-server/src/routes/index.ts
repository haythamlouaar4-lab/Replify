import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import ordersRouter from "./orders";
import storeSettingsRouter from "./store-settings";
import chatRouter from "./chat";
import notifyRouter from "./notify";
import authRouter from "./auth";
import webhooksRouter from "./webhooks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(storeSettingsRouter);
router.use(chatRouter);
router.use(notifyRouter);
router.use(authRouter);
router.use(webhooksRouter);

export default router;
