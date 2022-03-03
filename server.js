const axios = require("axios");
const express = require("express");
const app = express();
const cors = require("cors");
const redisDB = require("./redis-db");

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
////////////////
let multer = require("multer");
let upload = multer({ dest: "www/" });
//////////////////
const port = 3001;
const KEY = "ks.choi@alcherainc.com";

var fs = require("fs");
var path = require("path");
var PDFImage = require("pdf-image").PDFImage;

app.get("/api/health", (req, res) => {
  res.sendStatus(200);
});

app.post("/api/background", upload.single("image"), (req, res) => {
  if (req.body && req.body.key === KEY && req.file) {
    var filePath = req.file.path;
    var destPath = "www/background";
    fs.rename(filePath, destPath, async (err) => {
      if (err) {
        res.status(500).send(err.message);
        return;
      } else {
        await redisDB.saveData();
        res.sendStatus(201);
      }
    });
  } else {
    res.sendStatus(400);
  }
});

app.get("/api/noti", (req, res) => {
  var filePath = "www/noti.txt";
  try {
    let message = fs.readFileSync(filePath).toString();
    res.send(message);
  } catch (err) {
    res.send("");
  }
});

app.post("/api/noti", async (req, res) => {
  if (req.body && req.body.key === KEY) {
    var filePath = "www/noti.txt";
    var message = req.body.message;
    try {
      fs.writeFileSync(filePath, message);
      await redisDB.saveData();
      res.sendStatus(201);
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.sendStatus(400);
  }
});

app.post("/api/shiftee", async (req, res) => {
  if (req.body && req.body.cookie && req.body.type) {
    const isClockIn = req.body.type.toUpperCase() === "IN";
    const isClockOut = req.body.type.toUpperCase() === "OUT";
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
    let shift_id;
    const template = responseBatch.data.shiftTemplates.find(
      (v) => v.name === "9to6"
    );
    if (template) {
      const shift = responseBatch.data.shifts.find(
        (v) =>
          v.shift_template_id === template.shift_template_id &&
          v.employee_id === employee_id
      );
      if (shift) {
        shift_id = shift.shift_id;
      }
    }
    const attendance = responseBatch.data.attendances.find(
      (v) => v.employee_id === employee_id
    );
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
  const today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0, 0);
  return today.toISOString();
}

function getTodayEnd() {
  const today = new Date();
  today.setHours(23);
  today.setMinutes(59);
  today.setSeconds(59, 0);
  return today.toISOString();
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
