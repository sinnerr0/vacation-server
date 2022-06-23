const { google } = require("googleapis");
const _ = require("lodash");
const util = require("./util");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN = process.env.GOOGLE_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oAuth2Client.setCredentials(JSON.parse(TOKEN));
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

function listEvents() {
  return new Promise((resolve) => {
    calendar.events.list(
      {
        //calendarId: "primary",
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin: util.getTodayStart().format(),
        timeMax: util.getTodayStart().add(1, "month").format(),
        singleEvents: true,
        orderBy: "startTime",
      },
      (err, res) => {
        if (err) return console.error("The API returned an error: " + err);
        const items = _.map(res.data.items, (event) => _.pick(event, ["id", "summary", "start", "end"]));
        resolve(items);
      }
    );
  });
}

async function saveEvents(timeOffEvents) {
  for (let timeOffEvent of timeOffEvents) {
    if (util.isSameOrAfterToday(timeOffEvent.eventDate)) {
      await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: timeOffEvent.summary,
          start: {
            date: timeOffEvent.eventDate,
          },
          end: {
            date: util.getNextDate(timeOffEvent.eventDate),
          },
        },
      });
      console.debug(timeOffEvent.eventDate, timeOffEvent.summary);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

module.exports = {
  listEvents,
  saveEvents,
};
