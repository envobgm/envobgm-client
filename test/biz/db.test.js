const nedb = require('../../app/utils/db');

(async function f() {
  console.log(await nedb.getActiveCode());
})();
