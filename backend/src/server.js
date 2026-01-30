import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import config from "./config/config.js";
import app from "./app.js";

//const PORT = process.env.PORT || 5000;
const PORT = config.PORT || 5000;

// Connect DB then start server
(async () => {
  try{
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (err) {
    console.error("Failed to connect DB:", err.message);
    process.exit(1);
  }
})();

/**Your backend imports (import dotenv from "dotenv") mean you’re using ES modules 
("type": "module") but your package.json doesn’t declare it.
To avoid SyntaxError: Cannot use import statement outside a
 module, add this to package.json: "type": "module". **/