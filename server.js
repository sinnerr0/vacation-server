const express = require('express')
const app = express()
const cors = require('cors')

// heroku sleep protect
const https = require('https')
setInterval(function () {
  https.get('https://alchera.herokuapp.com/api/health')
}, 600000)

app.use(cors())
app.use(express.static('www'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
//////////////
const rateLimit = require('express-rate-limit')
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter) //  apply to all requests
///////////////
let helmet = require('helmet')
app.use(helmet())
app.disable('x-powered-by')
////////////////
let compression = require('compression')
app.use(compression())
////////////////
let multer = require('multer')
let upload = multer({ dest: 'www/' })
//////////////////
const port = process.env.PORT || 3001
const KEY = 'ks.choi@alcherainc.com'

var fs = require('fs')
var path = require('path')
var PDFImage = require('pdf-image').PDFImage

app.get('/api/health', (req, res) => {
  res.sendStatus(200)
})

app.post('/api/diet', upload.single('pdf'), (req, res) => {
  if (req.body && req.body.key === KEY && req.file && req.file.mimetype === 'application/pdf') {
    var filePath = req.file.path
    var pdfImage = new PDFImage(filePath)
    pdfImage.convertPage(0).then(
      function (imagePath) {
        fs.unlink(filePath, (err) => {
          if (err) {
            res.status(500).send(err.message)
            return
          }
          var pngPath = __dirname + path.sep + imagePath
          var destPath = 'www/diet.png'
          fs.rename(pngPath, destPath, (err) => {
            if (err) {
              res.status(500).send(err.message)
              return
            } else {
              res.sendStatus(201)
            }
          })
        })
      },
      function (err) {
        res.status(500).send(err.message)
        return
      }
    )
  } else {
    res.sendStatus(400)
  }
})

app.post('/api/background', upload.single('image'), (req, res) => {
  if (req.body && req.body.key === KEY && req.file) {
    var filePath = req.file.path
    var destPath = 'www/background'
    fs.rename(filePath, destPath, (err) => {
      if (err) {
        res.status(500).send(err.message)
        return
      } else {
        res.sendStatus(201)
      }
    })
  } else {
    res.sendStatus(400)
  }
})

app.get('/api/noti', (req, res) => {
  var filePath = 'noti.txt'
  try {
    let message = fs.readFileSync(filePath).toString()
    res.send(message)
  } catch (err) {
    res.send('')
  }
})

app.post('/api/noti', (req, res) => {
  if (req.body && req.body.key === KEY) {
    var filePath = 'noti.txt'
    var message = req.body.message
    try {
      fs.writeFileSync(filePath, message)
      res.sendStatus(201)
    } catch (err) {
      res.status(500).send(err.message)
    }
  } else {
    res.sendStatus(400)
  }
})

/////////////////
let createError = require('http-errors')
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})
// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500).send(err.message)
})

app.listen(port, () => {
  console.log(`app listening at port ${port}`)
})
