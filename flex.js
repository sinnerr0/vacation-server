const _ = require("lodash");
const fs = require("fs");
const path = require("path");

let userDB = [];
let birthdayDB = [];
let eventDB = [];
let memberDB = [];
const memberEmployeeNumber = [
  "2022041802",
  "2021090604",
  "14022001",
  "21010101",
  "21041301",
  "14022003",
  "2021102507",
  "14022002",
  "2022041803",
  "2021101801",
  "2022030103",
  "2022030108",
  "2022030105",
  "2022030703",
];

const directory = path.join(__dirname, "test");
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory);
}

function loadUser(item) {
  if (_.has(item, "list")) {
    const users = _.map(_.get(item, "list"), (info) => {
      const user = _.get(info, "user");
      const department = _.get(user, "positions[0].department.name");
      let result = _.pick(user, ["userIdHash", "name", "employeeNumber"]);
      result.department = department;
      return result;
    });
    userDB = userDB.concat(users);
  }
}
function uniqUser() {
  userDB = _.uniqBy(userDB, "userIdHash");
}

function loadBirthday(item) {
  if (_.has(item, "[0].month") && _.has(item, "[0].day")) {
    birthdayDB = _.concat(birthdayDB, item);
  }
}

function uniqBirthday() {
  birthdayDB = _.uniqBy(birthdayDB, "userIdHash");
}

function loadEvent(item) {
  if (_.has(item, "userSharingEvents")) {
    console.debug("event loaded");
    const event = _.map(
      _.map(_.filter(_.get(item, "userSharingEvents"), "timeOffEvents[0]"), (info) => _.pick(info, ["userIdHash", "timeOffEvents"])),
      (e) => {
        e.timeOffEvents = _.map(e.timeOffEvents, (e) => _.pick(e, ["eventName", "eventDate", "timeOffRegisterUnit"]));
        return e;
      }
    );
    eventDB = eventDB.concat(event);
  }
}

function mergeEvent() {
  return _.map(_.groupBy(eventDB, "userIdHash"), (v) =>
    _.reduce(v, (prev, curr) => {
      prev.timeOffEvents = _.uniqBy(prev.timeOffEvents.concat(curr.timeOffEvents), "eventDate");
      return prev;
    })
  );
}

function mergeDB() {
  _.forEach(userDB, (user) => _.merge(user, _.find(birthdayDB, { userIdHash: user.userIdHash }), _.find(eventDB, { userIdHash: user.userIdHash })));
}

function filterMember() {
  return _.filter(userDB, (user) => !!memberEmployeeNumber.find((employeeNumber) => user.employeeNumber === employeeNumber));
}

function init() {
  userDB = [];
  birthdayDB = [];
  eventDB = [];
}

function loadReponse(item) {
  loadUser(item);
  loadBirthday(item);
  loadEvent(item);
}

function save() {
  uniqUser();
  uniqBirthday();
  mergeEvent();
  fs.writeFileSync(path.join(__dirname, "test", "eventDB.json"), JSON.stringify(eventDB, null, 2));
  mergeDB();
  memberDB = filterMember();
  fs.writeFileSync(path.join(__dirname, "test", "memberDB.json"), JSON.stringify(memberDB, null, 2));
  init();
}

function diffTimeOff(events) {
  // google events는 동일한 이름의 이벤트가 여러개 있어 멤버를 기준으로 하나로 합쳐야 함.
  const mergedEvents = [];
  _.forEach(memberDB, (member) => {
    const filteredEvents = _.filter(events, (event) => event.summary.includes(member.name));
    const result = _.reduce(filteredEvents, (prev, curr) => {
      if (prev.timeOffEvents) {
        prev.timeOffEvents = prev.timeOffEvents.concat(curr.timeOffEvents);
        return prev;
      } else {
        return curr;
      }
    });
    if (result?.timeOffEvents.length) {
      result.name = member.name;
      mergedEvents.push(result);
    }
  });
  fs.writeFileSync(path.join(__dirname, "test", "googleEvents.json"), JSON.stringify(mergedEvents, null, 2));
  // memberDB vs mergedEvents
  const diffEvents = [];
  _.forEach(memberDB, (member) => {
    if (member.timeOffEvents) {
      const event = mergedEvents.find((event) => member.name === event.name);
      if (event) {
        const diff = _.differenceBy(member.timeOffEvents, event.timeOffEvents, "eventDate");
        if (diff.length) {
          diffEvents.push({ ...member, timeOffEvents: diff });
        }
      } else {
        diffEvents.push(member);
      }
    }
  });
  fs.writeFileSync(path.join(__dirname, "test", "diffEvents.json"), JSON.stringify(diffEvents, null, 2));
  return diffEvents;
}

module.exports = {
  init,
  loadReponse,
  save,
  diffTimeOff,
};
