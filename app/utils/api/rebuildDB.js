import nedb from '../dbUtil';

/**
 * 更新数据库
 * @returns {Promise<void>}
 */
export default async function rebuildDB(plan) {
  const activeCode = await nedb.getActiveCode();
  nedb.clear();
  await nedb.insert({ activeCode });
  await nedb.insert({ playerPlan: plan });
}
