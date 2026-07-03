const fs = require("fs");
const vm = require("vm");
const code = fs.readFileSync("js/carpet-calculator.js", "utf8");
const sandbox = { module: { exports: {} }, exports: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const { calcRoom, getRoomOrientInfo } = sandbox.module.exports;
const cases = [
  { room: { length: 4.1, width: 3.4 }, roll: 4, round: 0.1, waste: 0 },
  { room: { length: 3.4, width: 4.1 }, roll: 4, round: 0.1, waste: 0 },
  { room: { length: 5.1, width: 2.6 }, roll: 4, round: 0.1, waste: 0 },
  { room: { length: 7, width: 2.8 }, roll: 4, round: 0.1, waste: 0 },
];
for (const c of cases) {
  console.log('case', JSON.stringify(c));
  console.log('orient', getRoomOrientInfo(c.room, c.roll));
  console.log('calc', calcRoom(c.room, c.roll, c.round, [], 0, c.waste));
}
