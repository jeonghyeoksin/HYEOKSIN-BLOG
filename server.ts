import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import * as cheerio from "cheerio";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/crawl", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted tags
      $("script, style, nav, footer, header, ads, .ads, #ads").remove();

      // Get body text
      const text = $("body").text().replace(/\s+/g, " ").trim();
      
      // Limit text length to avoid token issues (e.g., 5000 chars)
      const cleanText = text.slice(0, 5000);

      res.json({ text: cleanText });
    } catch (error: any) {
      console.error("Crawl error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/naver/local", async (req, res) => {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Naver API credentials not configured" });
    }

    try {
      const response = await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query as string)}&display=5`, {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      });

      if (!response.ok) {
        throw new Error(`Naver API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Naver API proxy error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
