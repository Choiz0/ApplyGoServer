import express from "express";
import axios from "axios";
import cheerio from "cheerio";
import cors from "cors";

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "https://applygo-35e08.web.app", // 프론트엔드 URL을 허용
  })
);

// 데이터 가져오기 함수
const fetchDataFromPage = async (
  page,
  dateRange,
  location,
  keyword,
  includeKeywords,
  excludeKeywords
) => {
  const url = `https://www.seek.com.au/${keyword}-jobs/in-All-${location}?daterange=${dateRange}&page=${page}`;
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    let jobs = [];
    $("article").each((index, element) => {
      const title = $(element)
        .find('a[data-automation="jobTitle"]')
        .text()
        .trim();
      const link = $(element)
        .find('a[data-automation="jobTitle"]')
        .attr("href");
      const company = $(element)
        .find('a[data-automation="jobCompany"]')
        .text()
        .trim();
      const location = $(element)
        .find('a[data-automation="jobLocation"]')
        .text()
        .trim();
      const postedDateText = $(element)
        .find('span[data-automation="jobListingDate"]')
        .text()
        .trim();
      const salaryText = $(element)
        .find('span[data-automation="jobSalary"]')
        .text()
        .trim();
      let salary = parseInt(salaryText.replace(/[^0-9]/g, ""), 10);

      const ulElements = [];
      $(element)
        .find("ul")
        .each((i, ul) => {
          const liTexts = [];
          $(ul)
            .find("li")
            .each((j, li) => {
              liTexts.push($(li).text().trim());
            });
          ulElements.push(liTexts);
        });

      // 필터링 적용
      const titleLower = title.toLowerCase();
      const includeKeywordsLower = includeKeywords
        .toLowerCase()
        .split(",")
        .map((kw) => kw.trim())
        .filter(Boolean);
      const excludeKeywordsLower = excludeKeywords
        .toLowerCase()
        .split(",")
        .map((kw) => kw.trim())
        .filter(Boolean);

      const includesAnyKeywords =
        includeKeywordsLower.length === 0 ||
        includeKeywordsLower.some((kw) => titleLower.includes(kw));

      const excludesAnyKeywords =
        excludeKeywordsLower.length === 0 ||
        !excludeKeywordsLower.some((kw) => titleLower.includes(kw));

      if (includesAnyKeywords && excludesAnyKeywords) {
        jobs.push({
          title,
          link: `https://www.seek.com.au${link}`,
          company,
          location,
          salary,
          additionalDetails: ulElements,
          postedDate: postedDateText,
        });
      }
    });

    return jobs;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};

// 여러 페이지에서 데이터 가져오기 함수
const fetchDataFromAllPages = async (
  pages,
  dateRange,
  location,
  keyword,
  includeKeywords,
  excludeKeywords
) => {
  let allJobs = [];
  const maxPages = 3;
  for (let page = 1; page <= Math.min(pages, maxPages); page++) {
    const jobs = await fetchDataFromPage(
      page,
      dateRange,
      location,
      keyword,
      includeKeywords,
      excludeKeywords
    );
    allJobs = [...allJobs, ...jobs];
  }
  return allJobs;
};

// 데이터 요청 처리 라우트
app.get("/fetch-data", async (req, res) => {
  const {
    pages = 1,
    dateRange,
    location,
    keyword,
    includeKeywords,
    excludeKeywords,
  } = req.query;

  try {
    const jobs = await fetchDataFromAllPages(
      parseInt(pages, 10),
      dateRange,
      location,
      keyword,
      includeKeywords,
      excludeKeywords
    );
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: error.message });
  }
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
