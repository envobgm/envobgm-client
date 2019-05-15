const nedb = require('./db');

(async function f() {
  console.log(await nedb.getActiveCode());
})();
