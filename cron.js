const axios = require("axios");
const puppeteer = require("puppeteer");
const dateFns = require("date-fns");
const fs = require("fs");
const path = require("path");

const directory = path.join(__dirname, "www");
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory);
}

async function getHoliday(year, month) {
  const { data } = await axios.get(
    `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?_type=json&serviceKey=${process.env.SERVICE_KEY}&solYear=${year}&solMonth=${month}`
  );
  return data;
}

async function processHoliday() {
  let date = new Date();
  let year = dateFns.format(date, "yyyy");
  let month = dateFns.format(date, "MM");
  let data = await getHoliday(year, month);
  fs.writeFileSync(
    path.join(directory, "holidayThisMonth.json"),
    JSON.stringify(data)
  );

  date = dateFns.add(date, { months: 1 });
  year = dateFns.format(date, "yyyy");
  month = dateFns.format(date, "MM");
  data = await getHoliday(year, month);
  fs.writeFileSync(
    path.join(directory, "holidayNextMonth.json"),
    JSON.stringify(data)
  );
}

async function getDietImage() {
  try {
    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/chromium-browser",
      args: [
        "--disable-gpu",
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--no-zygote",
      ],
    });
    const page = await browser.newPage();
    await page.setCookie({
      name: "bizboxa",
      value: process.env.SESSION,
      url: "http://58.224.161.205/",
      path: "/",
      httpOnly: true,
    });
    await page.goto("http://58.224.161.205/");
    const noticeList = await page.$$(".list_con");
    let query, imageUrl;
    for (const notice of noticeList) {
      const text = await page.evaluate((el) => el.textContent, notice);
      if (text.includes("식단표")) {
        const boardHint = await page.evaluate(
          (el) => el.attributes.onclick.textContent,
          notice
        );
        query = /boardNo=\d+&artNo=\d+/g.exec(boardHint)[0];
        break;
      }
    }
    console.log("notice query=", query);
    if (query) {
      await page.goto(
        `http://58.224.161.205/edms/board/viewPostArtContent.do?${query}`
      );
      const image = await page.$("img");
      imageUrl = await page.evaluate((el) => el.src, image);
    }
    await browser.close();
    console.log("notice imageUrl=", imageUrl);
    if (imageUrl) {
      const { data } = await axios({
        method: "get",
        url: imageUrl,
        responseType: "stream",
      });
      data.pipe(fs.createWriteStream(path.join(directory, "diet.png")));
    }
  } catch (error) {
    console.error(error);
  }
}

var CronJob = require("cron").CronJob;
var job = new CronJob(
  "0 0 * * * *",
  async function () {
    await processHoliday();
    await getDietImage();
  },
  null,
  true,
  null,
  null,
  true
);
job.start();
