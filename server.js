const axios = require("axios");
const express = require("express");
const app = express();
const cors = require("cors");
const redisDB = require("./redis-db");
const moment = require("moment");
require("moment-timezone");

// heroku sleep protect
const https = require("https");
setInterval(function () {
  https.get("https://alchera.herokuapp.com/api/health");
}, 600000);

const corsOptions = { origin: "https://alchera.netlify.app" };
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//////////////
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter); //  apply to all requests
///////////////
let helmet = require("helmet");
app.use(helmet());
app.disable("x-powered-by");
////////////////
let compression = require("compression");
app.use(compression());
const port = 3001;

app.get("/api/health", (req, res) => {
  res.sendStatus(200);
});

app.post("/api/shiftee", async (req, res) => {
  if (req.body && req.body.cookie && req.body.type) {
    const isClockIn = req.body.type.toUpperCase() === "IN";
    const isClockOut = req.body.type.toUpperCase() === "OUT";
    console.log("/api/shiftee type=", req.body.type.toUpperCase());
    if (!isClockIn && !isClockOut) {
      return res.status(400).send("Params wrong");
    }
    let cookie;
    try {
      cookie = req.body.cookie
        .split(";")
        .filter(
          (v) =>
            v.includes("shiftee_account_auth_token") ||
            v.includes("shiftee_employee_auth_token")
        )
        .map((v) => v.trim())
        .map((v) => v.split("="));
    } catch (error) {
      console.log("/api/shiftee cookie value wrong");
      return res.status(400).send("Params wrong");
    }
    let shiftee_account_auth_token = "";
    let shiftee_employee_auth_token = "";
    for (let v of cookie) {
      if (v[0] === "shiftee_account_auth_token") {
        shiftee_account_auth_token = v[1];
      } else if (v[0] === "shiftee_employee_auth_token") {
        shiftee_employee_auth_token = v[1];
      }
    }
    if (!shiftee_account_auth_token || !shiftee_employee_auth_token) {
      console.log("/api/shiftee shiftee_token empty");
      return res.status(400).send("Params wrong");
    }
    let employee_id = JSON.parse(
      Buffer.from(
        shiftee_employee_auth_token.split(".")[1],
        "base64"
      ).toString()
    ).employee_id;
    let COOKIES = {
      headers: {
        Cookie: `shiftee_account_auth_token=${shiftee_account_auth_token}; shiftee_employee_auth_token=${shiftee_employee_auth_token};`,
      },
    };
    console.log("/api/shiftee employee_id=", employee_id);
    const responseAuth = await axios.get(
      `https://shiftee.io/api/company/employee/auth?employee_id=${employee_id}`,
      COOKIES
    );
    // const TOKEN = responseAuth.data.employee_auth_token;
    // COOKIES.headers.Authorization = `Bearer ${TOKEN}`;

    const responseBatch = await axios.post(
      "https://shiftee.io/api/batch",
      {
        account: true,
        company: false,
        timeclockAreas: false,
        locations: false,
        positions: false,
        employees: false,
        shiftTemplates: true,
        shifts: {
          date_ranges: [[getTodayStart(), getTodayEnd()]],
        },
        attendances: {
          date_ranges: [[getTodayStart(), getTodayEnd()]],
        },
        wages: false,
        leaveGroups: false,
        leaveTypes: false,
        leaves: {
          date_ranges: [[getTodayStart(), getTodayEnd()]],
        },
        leaveAccruals: false,
        leaveAccrualRules: false,
        schedulePatterns: false,
        customRequestTypes: false,
        requestApprovalRules: false,
      },
      COOKIES
    );
    const today = moment().tz("Asia/Seoul");
    const shift = responseBatch.data.shifts
      .filter((v) => v.employee_id === employee_id)
      .filter(
        (v) =>
          moment(v.start_time).tz("Asia/Seoul").format("YYYY-MM-DD") ===
          today.format("YYYY-MM-DD")
      )[0];
    console.log("/api/shiftee today=", today.format("YYYY-MM-DD"));
    console.log("/api/shiftee employee=", responseAuth.data.employee);
    console.log("/api/shiftee shift=", shift);
    let template, shift_id;
    if (shift) {
      shift_id = shift.shift_id;
      template = responseBatch.data.shiftTemplates.find(
        (v) => v.shift_template_id === shift.shift_template_id
      );
    }
    console.log("/api/shiftee template=", template);
    const attendance = responseBatch.data.attendances
      .filter((v) => v.employee_id === employee_id)
      .filter(
        (v) =>
          moment(v.clock_in_time).tz("Asia/Seoul").format("YYYY-MM-DD") ===
          today.format("YYYY-MM-DD")
      )[0];
    console.log("/api/shiftee attendance=", attendance);
    try {
      let responseClock;
      if (!attendance && isClockIn) {
        console.log("Clock-In", shift_id);
        responseClock = await axios.post(
          "https://shiftee.io/api/attendance/me/clock-in",
          {
            shift_id,
            location_id: responseAuth.data.employee.location_ids[0],
            // position_id: responseAuth.data.employee.position_ids[0],
            coordinate: [37.400148, 127.103385], // 판교 GB2 위치
          },
          COOKIES
        );
      } else if (attendance && isClockOut) {
        console.log("Clock-Out");
        const ATTENDANCE_ID = attendance.attendance_id;
        responseClock = await axios.patch(
          `https://shiftee.io/api/attendance/me/${ATTENDANCE_ID}/clock-out`,
          {
            attendance_id: ATTENDANCE_ID,
            coordinate: [37.400148, 127.103385], // 판교 GB2 위치
          },
          COOKIES
        );
      }
      res.sendStatus(200);
    } catch (e) {
      if (e.response && e.response.data) {
        console.error(e.response.data);
        return res.sendStatus(400);
      } else if (e.response) {
        console.error(e.response);
      } else {
        console.error(e);
      }
      return res.status(400).send(e.toString());
    }
  } else {
    return res.sendStatus(400);
  }
});

function getTodayStart() {
  return moment().tz("Asia/Seoul").startOf("day").utc().format();
}

function getTodayEnd() {
  return moment().tz("Asia/Seoul").endOf("day").utc().format();
}

/////////////////
let createError = require("http-errors");
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500).send(err.message);
});

app.listen(port, async () => {
  console.log(`app listening at port ${port}`);
  await redisDB.loadData();
});

console.log("range=", [getTodayStart(), getTodayEnd()]);
