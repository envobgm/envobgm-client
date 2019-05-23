/* eslint-disable no-void,no-underscore-dangle */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

/* eslint-disable no-return-await,func-names */
const path = require('path');

const os = require('os');

const Datastore = require('nedb');

const fs = require('fs');

const dbPath = path.join(os.homedir(), '.bgm', 'player.db');
let dbUtil = null;

function getDB() {
  if (dbUtil) {
    return dbUtil;
  }

  dbUtil = new Datastore({
    filename: dbPath,
    autoload: true
  });
  return dbUtil;
}

getDB.dbPath = dbPath;

getDB.clear = function() {
  return fs.unlinkSync(dbPath);
};

getDB.checkDBPath = function() {
  return fs.existsSync(dbPath);
};

getDB.insert = async function(doc) {
  return await new Promise(function(resolve, reject) {
    getDB().insert(doc, function(err, newDoc) {
      if (err) {
        reject(err);
      } else {
        resolve(newDoc);
      }
    });
  });
};

getDB.getActiveCode = async function() {
  return await new Promise(function(resolve) {
    getDB().find(
      {
        $where: function $where() {
          return Object.keys(this).indexOf('activeCode') !== -1;
        }
      },
      function(err, docs) {
        return resolve(docs && docs[0] ? docs[0].activeCode : null);
      }
    );
  });
};

getDB.getPlayerPlan = async function() {
  return await new Promise(function(resolve) {
    getDB().find(
      {
        $where: function $where() {
          return Object.keys(this).indexOf('playerPlan') !== -1;
        }
      },
      function(err, docs) {
        return resolve(docs && docs[0] ? docs[0].playerPlan : null);
      }
    );
  });
};

const _default = getDB;
exports.default = _default;
