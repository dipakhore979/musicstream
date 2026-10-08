import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const isUrlList = (value) =>
  value.split(",").every((item) => {
    try {
      new URL(item.trim());
      return true;
    } catch {
      return false;
    }
  });

// Validating env at boot means misconfiguration fails fast with a clear message
// instead of surfacing as a confusing runtime error later.
const schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    // One or more comma-separated frontend origins, e.g. https://app.vercel.app,https://musicstream.com
    CLIENT_URL: z
      .string()
      .min(1)
      .refine(isUrlList, "CLIENT_URL must be one or more comma-separated URLs")
      .default("http://localhost:5173"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    // Format: number + unit (s, m, h, d), e.g. 30m, 12h, 7d.
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^\d+[smhd]$/, "JWT_EXPIRES_IN must look like 15m, 12h or 7d")
      .default("7d"),
    // How many reverse proxies sit in front of the API (see README, "Trust proxy").
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),

    // ---- Email (used to send OTP codes) ----
    // console = print emails in the server log (development only), smtp / brevo / resend = real delivery.
    EMAIL_PROVIDER: z.enum(["console", "smtp", "brevo", "resend"]).default("console"),
    EMAIL_FROM: z.string().min(3).default("MusicStream <no-reply@musicstream.local>"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    BREVO_API_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    const require = (value, path, message) => {
      if (!value) ctx.addIssue({ code: "custom", path: [path], message });
    };
    if (v.NODE_ENV === "production" && v.EMAIL_PROVIDER === "console") {
      require(false, "EMAIL_PROVIDER", "'console' only prints codes to the log, so it can't be used in production. Use brevo, resend or smtp.");
    }
    if (v.EMAIL_PROVIDER === "smtp") {
      require(v.SMTP_HOST, "SMTP_HOST", "required when EMAIL_PROVIDER=smtp");
      require(v.SMTP_USER, "SMTP_USER", "required when EMAIL_PROVIDER=smtp");
      require(v.SMTP_PASS, "SMTP_PASS", "required when EMAIL_PROVIDER=smtp");
    }
    if (v.EMAIL_PROVIDER === "brevo") require(v.BREVO_API_KEY, "BREVO_API_KEY", "required when EMAIL_PROVIDER=brevo");
    if (v.EMAIL_PROVIDER === "resend") require(v.RESEND_API_KEY, "RESEND_API_KEY", "required when EMAIL_PROVIDER=resend");
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

// Origins allowed by CORS and by the CSRF origin check. In development we also allow the
// `vite preview` port, so you can test the installable (production-built) app locally.
const origins = env.CLIENT_URL.split(",").map((o) => new URL(o.trim()).origin);
if (!isProd) origins.push("http://localhost:4173");
export const allowedOrigins = [...new Set(origins)];
