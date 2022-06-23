const axios = require("axios");
const _ = require("lodash");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
require("moment-timezone");
moment.tz.setDefault("Asia/Seoul");

let holidayThisMonth = [];
let holidayNextMonth = [];

function getTodayStart() {
  return moment().startOf("d").utc();
}

function getTodayEnd() {
  return moment().endOf("d").utc();
}

function diffDate(start, end) {
  return moment(end).diff(moment(start), "d");
}

function isSameOrAfterToday(date) {
  return moment(date).isSameOrAfter(getTodayStart());
}

function isWeekend(date) {
  const day = moment(date).day();
  return day === 0 || day === 6 ? true : false;
}

function getNextDate(date) {
  return moment(date).add(1, "d").format("YYYY-MM-DD");
}

function getHolidayList(holiday) {
  let holidayList = [];
  if (holiday.totalCount > 0) {
    holidayList = _.filter(holiday.items.item, (item) => item.isHoliday === "Y");
    holidayList = _.map(holidayList, (item) => {
      const locdate = String(item.locdate);
      return locdate.substring(0, 4) + "-" + locdate.substring(4, 6) + "-" + locdate.substring(6, 8);
    });
  }
  return holidayList;
}

async function pullHoliday() {
  try {
    let res = await axios.get("https://alchera.herokuapp.com/holidayThisMonth.json");
    let holiday = res.data?.response?.body;
    holidayThisMonth = getHolidayList(holiday);
    res = await axios.get("https://alchera.herokuapp.com/holidayNextMonth.json");
    holiday = res.data?.response?.body;
    holidayNextMonth = getHolidayList(holiday);
  } catch (e) {
    try {
      holidayThisMonth = getHolidayList(JSON.parse(fs.readFileSync(path.join(__dirname, "www", "holidayThisMonth.json")).toString()));
      holidayNextMonth = getHolidayList(JSON.parse(fs.readFileSync(path.join(__dirname, "www", "holidayNextMonth.json")).toString()));
    } catch (e) {}
  }
}

function makeDateListIgnoreHoliday(startDate, count) {
  let holidayList = holidayThisMonth.concat(holidayNextMonth);
  let dateList = [];
  let start = moment(startDate);
  for (let i = 0; i < count; i++) {
    const date = start.format("YYYY-MM-DD");
    if (!isWeekend(date) && !holidayList.includes(date)) {
      dateList.push(date);
    }
    start.add(1, "d");
  }
  return dateList;
}

module.exports = {
  getTodayStart,
  getTodayEnd,
  getNextDate,
  pullHoliday,
  isSameOrAfterToday,
  diffDate,
  makeDateListIgnoreHoliday,
};
