// index.js
const express = require("express");
const cors = require("cors");
const ytdl = require("@distube/ytdl-core");
const yts = require("yt-search");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const NodeCache = require("node-cache");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Anti-bot detection configuration
const ytdlOptions = {
  requestOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    }
  }
};

// Retry function for handling bot detection
async function retryYtdlOperation(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`[retry] Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`[retry] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Serve static files (like test.html)

const cache = new NodeCache({ stdTTL: 60 * 5 }); // cache search results 5min

// Root endpoint - serve test page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/test.html");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
  });
});

// Simple search endpoint: /search?q=artist+title
app.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "missing q query param" });

    const key = `search:${q}`;
    let results = cache.get(key);
    if (!results) {
      const r = await yts(q);
      const videos = (r && r.videos) || [];
      results = videos.slice(0, 5).map((v) => ({
        id: v.videoId,
        title: v.title,
        author: v.author && v.author.name,
        seconds: v.seconds,
        timestamp: v.timestamp,
        url: v.url,
        thumbnail: v.image,
      }));
      cache.set(key, results);
    }
    res.json({ q, results });
  } catch (err) {
    console.error("search error", err);
    res.status(500).json({ error: "search failed" });
  }
});

// Stream endpoint: /stream?id=VIDEO_ID  OR  /stream?q=artist+title
// robust stream handler (replace or add as /stream-fixed)
// --- Robust general stream handler and a fixed test route ---
// Replace your existing /stream handler with these two routes.

app.get("/stream", async (req, res) => {
  try {
    let videoId = req.query.id;
    const q = (req.query.q || "").trim();

    if (!videoId && !q)
      return res.status(400).json({ error: "missing id or q param" });

    // If q provided, search
    if (!videoId && q) {
      console.log("[stream] searching for query:", q);
      const cached = cache.get(`search:${q}`);
      let first;
      if (cached && cached.length) first = cached[0];
      else {
        const r = await yts(q);
        first = (r.videos && r.videos[0]) || null;
      }
      if (!first)
        return res.status(404).json({ error: "no video found for query" });
      videoId = first.videoId;
      console.log("[stream] selected videoId from search:", videoId);
    }

    // Validate
    if (!ytdl.validateID(videoId)) {
      console.warn("[stream] invalid video id:", videoId);
      return res.status(400).json({ error: "invalid video id" });
    }

    // Fetch info (may throw / network fail)
    let info;
    try {
      info = await retryYtdlOperation(() => ytdl.getInfo(videoId, ytdlOptions));
    } catch (e) {
      console.error(
        "[stream] ytdl.getInfo error:",
        e && e.message ? e.message : e
      );
      return res.status(502).json({
        error: "failed to get video info from youtube",
        detail: String(e && e.message ? e.message : e),
      });
    }
    const title = info.videoDetails.title || "unknown";

    // Headers
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${sanitizeFilename(title)}.mp3"`
    );
    res.setHeader("Content-Type", "audio/mpeg");

    // Create ytdl stream
    const ytdlStream = ytdl(videoId, {
      quality: "highestaudio",
      filter: "audioonly",
      highWaterMark: 1 << 25,
      ...ytdlOptions
    });

    ytdlStream.on("error", (e) => {
      console.error(
        "[stream] ytdl stream error:",
        e && e.message ? e.message : e
      );
      // If streaming hasn't started, send JSON error otherwise end response
      if (!res.headersSent)
        return res.status(502).json({
          error: "error fetching media from youtube",
          detail: String(e && e.message ? e.message : e),
        });
      try {
        res.end();
      } catch (ex) {}
    });

    // Transcode with ffmpeg -> mp3
    const ff = ffmpeg()
      .input(ytdlStream)
      .noVideo()
      .audioBitrate(128)
      .format("mp3")
      .on("start", (cmd) => console.log("[stream] ffmpeg start:", cmd))
      .on("codecData", (data) =>
        console.log("[stream] ffmpeg codecData:", data)
      )
      .on("progress", (p) => console.log("[stream] ffmpeg progress", p))
      .on("error", (err) => {
        console.error(
          "[stream] ffmpeg error:",
          err && err.message ? err.message : err
        );
        // If specific encoder missing, include that in response
        const msg = err && err.message ? err.message : "ffmpeg failed";
        if (!res.headersSent)
          return res
            .status(500)
            .json({ error: "transcoding failed", detail: msg });
        try {
          res.end();
        } catch (ex) {}
      })
      .on("end", () => {
        console.log("[stream] ffmpeg finished");
        try {
          res.end();
        } catch (ex) {}
      });

    // Pipe ffmpeg output to response
    ff.pipe(res, { end: true });
  } catch (err) {
    console.error(
      "[stream] unexpected error",
      err && err.stack ? err.stack : err
    );
    if (!res.headersSent)
      res.status(500).json({
        error: "internal server error",
        detail: String(err && err.message ? err.message : err),
      });
  }
});

// Fixed test route for the Hansraj Radhe Radhe ID
app.get("/stream-fixed", async (req, res) => {
  try {
    const videoId = "OXm4-3Er8po";
    // Reuse the same approach: validate, getInfo, stream
    if (!ytdl.validateID(videoId))
      return res.status(400).json({ error: "invalid video id" });
    const info = await retryYtdlOperation(() => ytdl.getInfo(videoId, ytdlOptions));
    const title = info.videoDetails.title || "radhe-hansraj";
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${sanitizeFilename(title)}.mp3"`
    );
    res.setHeader("Content-Type", "audio/mpeg");

    const ytdlStream = ytdl(videoId, {
      quality: "highestaudio",
      filter: "audioonly",
      highWaterMark: 1 << 25,
      ...ytdlOptions
    });
    ytdlStream.on("error", (e) => {
      console.error("[stream-fixed] ytdl error", e);
      if (!res.headersSent)
        return res
          .status(502)
          .json({ error: "youtube fetch error", detail: String(e) });
    });

    const ff = ffmpeg()
      .input(ytdlStream)
      .noVideo()
      .audioBitrate(128)
      .format("mp3")
      .on("start", (c) => console.log("[stream-fixed] ffmpeg start:", c))
      .on("error", (e) => {
        console.error(
          "[stream-fixed] ffmpeg error",
          e && e.message ? e.message : e
        );
        if (!res.headersSent)
          return res.status(500).json({
            error: "transcoding failed",
            detail: String(e && e.message ? e.message : e),
          });
      })
      .on("end", () => console.log("[stream-fixed] ffmpeg finished"));

    ff.pipe(res, { end: true });
  } catch (e) {
    console.error("[stream-fixed] unexpected error", e);
    if (!res.headersSent)
      res.status(500).json({
        error: "internal server error",
        detail: String(e && e.message ? e.message : e),
      });
  }
});

// Alternative endpoint with enhanced bot detection avoidance
app.get("/stream-alt", async (req, res) => {
  try {
    let videoId = req.query.id;
    const q = (req.query.q || "").trim();

    if (!videoId && !q)
      return res.status(400).json({ error: "missing id or q param" });

    // If q provided, search
    if (!videoId && q) {
      const r = await yts(q);
      const first = (r.videos && r.videos[0]) || null;
      if (!first)
        return res.status(404).json({ error: "no video found for query" });
      videoId = first.videoId;
    }

    if (!ytdl.validateID(videoId)) {
      return res.status(400).json({ error: "invalid video id" });
    }

    // Enhanced options for bot detection avoidance
    const enhancedOptions = {
      ...ytdlOptions,
      requestOptions: {
        ...ytdlOptions.requestOptions,
        headers: {
          ...ytdlOptions.requestOptions.headers,
          'Referer': 'https://www.youtube.com/',
          'X-YouTube-Client-Name': '1',
          'X-YouTube-Client-Version': '2.20210721.00.00',
        }
      }
    };

    let info;
    try {
      info = await retryYtdlOperation(() => ytdl.getInfo(videoId, enhancedOptions));
    } catch (e) {
      console.error("[stream-alt] ytdl.getInfo error:", e.message);
      return res.status(502).json({
        error: "failed to get video info from youtube",
        detail: "Bot detection triggered. Try again later or use a different video."
      });
    }

    const title = info.videoDetails.title || "unknown";
    res.setHeader("Content-Disposition", `inline; filename="${sanitizeFilename(title)}.mp3"`);
    res.setHeader("Content-Type", "audio/mpeg");

    const ytdlStream = ytdl(videoId, {
      quality: "highestaudio",
      filter: "audioonly",
      highWaterMark: 1 << 25,
      ...enhancedOptions
    });

    ytdlStream.on("error", (e) => {
      console.error("[stream-alt] ytdl stream error:", e.message);
      if (!res.headersSent)
        return res.status(502).json({ 
          error: "streaming failed", 
          detail: "Bot detection or network issue" 
        });
    });

    const ff = ffmpeg()
      .input(ytdlStream)
      .noVideo()
      .audioBitrate(128)
      .format("mp3")
      .on("start", (cmd) => console.log("[stream-alt] ffmpeg start"))
      .on("error", (err) => {
        console.error("[stream-alt] ffmpeg error:", err.message);
        if (!res.headersSent)
          return res.status(500).json({ error: "transcoding failed" });
      })
      .on("end", () => console.log("[stream-alt] ffmpeg finished"));

    ff.pipe(res, { end: true });
  } catch (e) {
    console.error("[stream-alt] unexpected error", e);
    if (!res.headersSent)
      res.status(500).json({ error: "internal server error" });
  }
});

// small helper to sanitize filenames
function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-\.()\[\] ]/gi, "").slice(0, 200);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`YouTube-audio-proxy running on http://localhost:${PORT}`)
);
