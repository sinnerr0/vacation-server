const axios = require('axios')
const dateFns = require('date-fns')
const fs = require('fs')

async function getHoliday() {
  let date = new Date()
  let year = dateFns.format(date, 'yyyy')
  let month = dateFns.format(date, 'MM')
  const { data } = await axios.get(`http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?_type=json&serviceKey=8J55wvyP%2B3YGd4DrkAR%2BjxDCTOqInIIRS%2FVKffKJpYaA%2BcHlDf4Ksz0yqiJ%2Fp1EgS78qdYgotsPA7U6gCd1%2F9w%3D%3D&solYear=${year}&solMonth=${month}`)
  fs.writeFileSync('holiday.json', JSON.stringify(data))
}

getHoliday()
