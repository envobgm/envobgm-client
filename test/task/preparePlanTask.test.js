import sinon from 'sinon';
import { invokePrepareTask, checkPlan } from '../../app/task/preparePlanTask';

describe('preparePlanTask', () => {
  it('fire invokePrepareTask, and prepare plan successfully', () => {
    const now = new Date('2019-05-05 18:59:00').getTime();
    const clock = sinon.useFakeTimers(now);
    invokePrepareTask();
    clock.tick(1000 * 60 * 2);
  });

  it('test checkPlan method', async () => {
    await checkPlan();
  });
});
