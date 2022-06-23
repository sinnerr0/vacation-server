const fs = require("fs");
const path = require("path");

const REDIS_URL = process.env.REDIS_URL;
let redis, mget, mset, dataKeys;
if (REDIS_URL) {
  redis = require("redis").createClient(REDIS_URL, {
    return_buffers: true,
  });

  redis.on("ready", async () => {
    console.debug("redis ready");
  });

  redis.on("error", (err) => {
    console.error(err);
  });

  const { promisify } = require("util");
  mget = promisify(redis.mget).bind(redis);
  mset = promisify(redis.mset).bind(redis);
  dataKeys = ["holidayNextMonth.json", "holidayThisMonth.json"];
}

async function saveData() {
  if (!REDIS_URL) return;
  try {
    let msetParams = [];
    for (const key of dataKeys) {
      try {
        const data = fs.readFileSync(path.join(__dirname, "www", key));
        msetParams.push(key);
        msetParams.push(data);
      } catch (error) {}
    }
    console.debug("saveData", msetParams);
    const result = await mset(...msetParams);
  } catch (err) {
    console.error("saveData", err);
  }
}

async function loadData() {
  if (!REDIS_URL) return;
  try {
    const result = await mget(...dataKeys);
    let loadedKeys = [];
    for (const [index, data] of result.entries()) {
      try {
        data && fs.writeFileSync(path.join(__dirname, "www", dataKeys[index]), data);
        loadedKeys.push(dataKeys[index]);
      } catch (error) {}
    }
    console.debug("loadData", loadedKeys);
  } catch (err) {
    console.error("loadData", err);
  }
}

module.exports = {
  saveData,
  loadData,
};
