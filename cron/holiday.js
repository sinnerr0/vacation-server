const axios = require('axios')
const dateFns = require('date-fns')
const fs = require('fs')

async function getHoliday(year, month) {
  const { data } = await axios.get(
    `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?_type=json&serviceKey=${process.env.SERVICE_KEY}&solYear=${year}&solMonth=${month}`
  )
  return data
}

async function main() {
  let date = new Date()
  let year = dateFns.format(date, 'yyyy')
  let month = dateFns.format(date, 'MM')
  let data = await getHoliday(year, month)
  fs.writeFileSync(__dirname + '/www/holidayThisMonth.json', JSON.stringify(data))

  date = dateFns.add(date, { months: 1 })
  year = dateFns.format(date, 'yyyy')
  month = dateFns.format(date, 'MM')
  data = await getHoliday(year, month)
  fs.writeFileSync(__dirname + '/www/holidayNextMonth.json', JSON.stringify(data))
}

main()
