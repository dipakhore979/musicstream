import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { allowedOrigins, env, isProd } from "./config/env.js";
import routes from "./routes/index.js";
import { csrfGuard } from "./middleware/csrf.js";
import { sanitize } from "./middleware/sanitize.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Needed behind Render/Railway/Vercel so rate limiting sees the real client IP, not the proxy's.
app.set("trust proxy", env.TRUST_PROXY_HOPS);
app.disable("x-powered-by");

app.use(
  helmet({
    // This server only returns JSON, so lock everything else down.
    contentSecurityPolicy: { useDefaults: false, directives: { "default-src": ["'none'"], "frame-ancestors": ["'none'"] } },
    // The frontend lives on another origin and must be able to use this API's responses.
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
  })
);

app.use(
  cors({
    // Anything not on the allow-list simply gets no CORS headers, so the browser blocks it.
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true, // needed so the browser sends the httpOnly auth cookie
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 600,
  })
);

// No endpoint needs large JSON bodies (file uploads use multipart), so keep the limit small.
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());
app.use(sanitize);
app.use(morgan(isProd ? "combined" : "dev"));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProd ? 600 : 3000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
  })
);

app.use("/api", csrfGuard);
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
