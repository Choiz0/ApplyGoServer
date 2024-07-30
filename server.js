// server.js
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "https://applygo-35e08.web.app", // 프론트엔드 URL을 허용
  })
);

app.get("/", (req, res) => {
  res.send("Hello from Render.com!");
});

app.get("/api/fetch-data", async (req, res) => {
  try {
    const response = await axios.get("https://geo.brdtest.com/mygeo.json");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
