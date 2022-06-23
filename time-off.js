const puppeteer = require("puppeteer");
const flex = require("./flex");
const google = require("./google");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const util = require("./util");

const TIME_OFF_TEXT = {
  휴가: "DAY",
  오전반차: "AM",
  오후반차: "PM",
};
const TIME_OFF_TYPE = {
  DAY: "휴가",
  AM: "오전반차",
  PM: "오후반차",
};

async function logResponse(response) {
  try {
    const json = await response.json();
    flex.loadReponse(json);
  } catch (error) {
    // nothing
  }
}

async function processTimeOff() {
  console.debug("processTimeOff start", fs.existsSync(path.join("/usr", "bin", "chromium-browser")));
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    args: ["--disable-gpu", "--disable-setuid-sandbox", "--no-sandbox", "--no-zygote"],
  });
  const page = await browser.newPage();
  await page.goto("https://flex.team/auth/login");
  const email = await page.waitForSelector("input[type=email]");
  await email.type(process.env.CHOI_USERNAME);
  await email.press("Enter");
  const password = await page.waitForSelector("input[type=password]");
  await password.type(process.env.CHOI_PASSWORD);
  await password.press("Enter");
  await page.waitForTimeout(20000);
  let buttons = await page.$$("button");
  let promiseList = [],
    moreBtnIndex = -1;
  moreBtn = null;
  buttons.forEach((btn) => {
    const promise = btn.evaluate((node) => node.textContent);
    promiseList.push(promise);
  });
  const textContents = await Promise.all(promiseList);
  textContents.some((text, i) => {
    const result = text.includes("더보기");
    if (result) moreBtnIndex = i;
    return result;
  });
  console.debug(moreBtnIndex, textContents);
  moreBtn = buttons[moreBtnIndex];
  if (moreBtn) {
    flex.init();
    page.on("response", logResponse);
    moreBtn.click();
    await page.waitForTimeout(20000);
    buttons = await page.$$("button");
    console.debug("buttons.length", buttons.length);
    buttons[buttons.length - 1].click();
    await page.waitForTimeout(10000);
    console.debug("buttons.length", buttons.length);
    buttons[buttons.length - 1].click();
    await page.waitForTimeout(10000);
    console.debug("buttons.length", buttons.length);
    buttons[buttons.length - 1].click();
    await page.waitForTimeout(10000);
    console.debug("buttons.length", buttons.length);
    buttons[buttons.length - 1].click();
    await page.waitForTimeout(10000);
    page.off("response", logResponse);
    console.debug("processTimeOff flex save");
    flex.save();
    try {
      await util.pullHoliday();
    } catch (error) {}
    const diffEvents = flex.diffTimeOff(await getEvents());
    await saveEvents(diffEvents);
  }
  await browser.close();
  console.debug("processTimeOff end");
}

async function getEvents() {
  const events = await google.listEvents();
  _.forEach(events, (event) => {
    const startDate = event.start.date;
    const endDate = event.end.date;
    event.timeOffEvents = util.makeDateListIgnoreHoliday(startDate, util.diffDate(startDate, endDate)).map((date) => {
      let timeOffRegisterUnit = "DAY";
      if (event.summary.includes(TIME_OFF_TYPE["AM"])) {
        timeOffRegisterUnit = "HALF_DAY_AM";
      } else if (event.summary.includes(TIME_OFF_TYPE["PM"])) {
        timeOffRegisterUnit = "HALF_DAY_PM";
      }
      return {
        eventName: "휴가",
        eventDate: date,
        timeOffRegisterUnit,
      };
    });
  });
  return events;
}

async function saveEvents(diffEvents) {
  const timeOffEvents = [];
  _.map(diffEvents, (event) => {
    _.forEach(event.timeOffEvents, (timeOffEvent) => {
      let timeOffRegisterUnit = "휴가";
      if (timeOffEvent.timeOffRegisterUnit.includes(TIME_OFF_TEXT["오전반차"])) {
        timeOffRegisterUnit = "오전반차";
      } else if (timeOffEvent.timeOffRegisterUnit.includes(TIME_OFF_TEXT["오후반차"])) {
        timeOffRegisterUnit = "오후반차";
      }
      timeOffEvents.push({
        summary: `[${timeOffRegisterUnit}] ${event.name}`,
        eventDate: timeOffEvent.eventDate,
      });
    });
  });
  await google.saveEvents(timeOffEvents);
}

module.exports = {
  processTimeOff,
};
