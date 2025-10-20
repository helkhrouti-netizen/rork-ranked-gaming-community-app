import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { sendVerificationRoute } from "./routes/auth/send-verification/route";
import { verifyCodeRoute } from "./routes/auth/verify-code/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    sendVerification: sendVerificationRoute,
    verifyCode: verifyCodeRoute,
  }),
});

export type AppRouter = typeof appRouter;
