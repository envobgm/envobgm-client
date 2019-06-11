import sinon from 'sinon';
import { invokeClearTask } from '../../app/utils/task/clearCacheTask';

describe('clearCacheSchedule', () => {
  const now = new Date('2019-05-30 20:59:00').getTime();
  const clock = sinon.useFakeTimers(now);
  it('fire invokeClearTask, and clear cache successfully', () => {
    invokeClearTask();
    clock.tick(1000 * 60 * 2); // 过了两分钟
  });

  // it('test clearCache function', async () => {
  //   await clearCache();
  // });
});
