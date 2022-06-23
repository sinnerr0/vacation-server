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
const port = process.env.PORT ?? 3001;

app.get("/api/health", (req, res) => {
  res.sendStatus(200);
});

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
  console.debug(`app listening at port ${port}`);
  await redisDB.loadData();
});
