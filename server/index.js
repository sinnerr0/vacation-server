const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
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
let upload = multer({ dest: "uploads/" });
//////////////////
const port = 3000;

app.get("/", (req, res) => {
  res.send("ok");
});

var fs = require("fs");
var path = require("path");
var PDFImage = require("pdf-image").PDFImage;

app.post("/diet", upload.single("pdf"), (req, res) => {
  if (req.file && req.file.mimetype === "application/pdf") {
    var filePath = req.file.path;
    var pdfImage = new PDFImage(filePath);
    pdfImage.convertPage(0).then(
      function(imagePath) {
        fs.unlink(filePath, (err) => {
          if (err) {
            res.status(500).send(err.message);
            return;
          }
          var pngPath = __dirname + path.sep + imagePath;
          var destPath = "/var/www/html/diet.png";
          fs.rename(pngPath, destPath, (err) => {
            if (err) {
              fs.rename(pngPath, "uploads/diet.png", (err) => {
                if (err) {
                  res.status(500).send(err.message);
                  return;
                } else {
                  res.sendStatus(500);
                }
              });
              return;
            } else {
              res.sendStatus(201);
            }
          });
        });
      },
      function(err) {
        res.status(500).send(err.message);
        return;
      }
    );
  } else {
    res.sendStatus(400);
  }
});

/////////////////
let createError = require("http-errors");
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500).send(err.message);
});

app.listen(port, () => {
  console.log(`app listening at port ${port}`);
});
