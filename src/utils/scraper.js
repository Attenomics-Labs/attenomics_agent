import { Scraper } from "agent-twitter-client";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import { Cookie } from "tough-cookie";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// cookie file path
const COOKIE_FILE_PATH = join(__dirname, "cookies.json");

/**
 * Load cookies from file if they exist
 * @returns {Promise<Array|null>} The cookies array or null if file doesn't exist
 */

const loadCookies = async () => {
  try {
    const cookieData = await fs.readFile(COOKIE_FILE_PATH, "utf-8");
    const cookiesJson = JSON.parse(cookieData);

    // Convert each cookie object back to Cookie instance
    return cookiesJson.map((cookieData) => Cookie.fromJSON(cookieData));
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("No existing cookies found.");
      return null;
    }
    console.error("Error reading cookies:", error);
    return null;
  }
};

/**
 * Save cookies to file
 * @param {Array} cookies - The cookies to save
 */

const saveCookies = async (cookies) => {
  try {
    // Convert Cookie instances to JSON-serializable objects
    const cookiesJson = cookies.map((cookie) => cookie.toJSON());
    await fs.writeFile(COOKIE_FILE_PATH, JSON.stringify(cookiesJson, null, 2));
    console.log("Cookies saved successfully.");
  } catch (error) {
    console.error("Error saving cookies:", error);
  }
};

/**
 * Get or create a scraper instance.
 * - First tries to use cached cookies
 * - If cookies don't exist or are invalid, logs in with credentials and caches new cookies
 */
const getScraper = async () => {
  const scraper = new Scraper();

  // Try to load existing cookies
  const cookies = await loadCookies();

  if (cookies && cookies.length > 0) {
    console.log("Found existing cookies, attempting to restore session...");
    try {
      await scraper.setCookies(cookies);

      // Verify if the cookies are still valid
      const isLoggedIn = await scraper.isLoggedIn();
      if (isLoggedIn) {
        console.log("Successfully restored session from cookies.");
        return scraper;
      }
      console.log("Cookies expired, need to login again.");
    } catch (error) {
      console.error("Error restoring cookies:", error);
      console.log("Will attempt fresh login...");
    }
  }

  // If we get here, we need to log in with credentials
  try {
    console.log("Logging in with credentials...");
    await scraper.login(
      process.env.TWITTER_USERNAME || "",
      process.env.TWITTER_PASSWORD || "",
      process.env.TWITTER_EMAIL || "",
      process.env.TWITTER_API_KEY || "",
      process.env.TWITTER_API_SECRET_KEY || "",
      process.env.TWITTER_ACCESS_TOKEN || "",
      process.env.TWITTER_ACCESS_TOKEN_SECRET || ""
    );

    // Save the new cookies
    const newCookies = await scraper.getCookies();
    await saveCookies(newCookies);

    return scraper;
  } catch (error) {
    console.error("Login failed:", error);
    throw new Error("Failed to initialize Twitter scraper");
  }
};

export default getScraper;