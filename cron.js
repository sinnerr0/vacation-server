const axios = require('axios')
const dateFns = require('date-fns')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const directory = path.join(__dirname, 'www')
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory)
}

async function getHoliday(year, month) {
  const { data } = await axios.get(`http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?_type=json&serviceKey=${process.env.SERVICE_KEY}&solYear=${year}&solMonth=${month}`)
  return data
}

async function processHoliday() {
  let date = new Date()
  let year = dateFns.format(date, 'yyyy')
  let month = dateFns.format(date, 'MM')
  let data = await getHoliday(year, month)
  fs.writeFileSync(path.join(directory, 'holidayThisMonth.json'), JSON.stringify(data))

  date = dateFns.add(date, { months: 1 })
  year = dateFns.format(date, 'yyyy')
  month = dateFns.format(date, 'MM')
  data = await getHoliday(year, month)
  fs.writeFileSync(path.join(directory, 'holidayNextMonth.json'), JSON.stringify(data))
}

var CronJob = require('cron').CronJob
var job = new CronJob(
  '0 0 * * * *',
  async function () {
    exec('sh vacation.sh', (error, stdout, stderr) => {
      if (error) {
        console.log(`sh vacation.sh error: ${error}`)
      }
    })
    await processHoliday()
  },
  null,
  true,
  null,
  null,
  true
)
job.start()
