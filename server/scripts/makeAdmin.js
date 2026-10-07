// Usage (from /server):  npm run make-admin -- someone@example.com
// Promotes an existing user to admin. Needed because signup never grants the admin role.
import { connectDB, disconnectDB } from "../src/config/db.js";
import User from "../src/models/User.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}

try {
  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
  if (!user) {
    console.error(`No user found with email ${email}. Sign up in the app first.`);
    process.exitCode = 1;
  } else {
    console.log(`${user.name} <${user.email}> is now an admin.`);
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
