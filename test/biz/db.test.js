const nedb = require('../../app/utils/dbUtil');

(async function f() {
  console.log(await nedb.getActiveCode());
})();
