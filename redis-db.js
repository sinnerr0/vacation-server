const REDIS_URL = process.env.REDIS_URL
const redis = require('redis').createClient(REDIS_URL, { return_buffers: true })
const fs = require('fs')
const { promisify } = require('util')
const mget = promisify(redis.mget).bind(redis)
const mset = promisify(redis.mset).bind(redis)

redis.on('ready', async () => {
  console.info('redis ready')
})

redis.on('error', (err) => {
  console.error(err)
})

const dataKeys = ['background', 'diet.png', 'holidayNextMonth.json', 'holidayThisMonth.json', 'vacation.json', 'noti.txt']

async function saveData() {
  try {
    let msetParams = []
    for (const key of dataKeys) {
      try {
        const data = fs.readFileSync(`www/${key}`)
        msetParams.push(key)
        msetParams.push(data)
      } catch (error) {}
    }
    console.debug('saveData', msetParams)
    const result = await mset(...msetParams)
  } catch (err) {
    console.error('saveData', err)
  }
}

async function loadData() {
  try {
    const result = await mget(...dataKeys)
    let loadedKeys = []
    for (const [index, data] of result.entries()) {
      try {
        data && fs.writeFileSync(`www/${dataKeys[index]}`, data)
        loadedKeys.push(dataKeys[index])
      } catch (error) {}
    }
    console.debug('loadData', loadedKeys)
  } catch (err) {
    console.error('loadData', err)
  }
}

module.exports = {
  saveData,
  loadData,
}
