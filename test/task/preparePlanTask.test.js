import sinon from 'sinon';
import { checkPlan, invokePrepareTask } from '../../app/task/preparePlanTask';

describe('preparePlanTask', () => {
  it('test invokePrepareTask', () => {
    const now = new Date('2019-05-05 18:59:00').getTime();
    const clock = sinon.useFakeTimers(now);
    invokePrepareTask();
    clock.tick(1000 * 60 * 2);
    clock.restore();
  });

  it('test checkPlan method', async () => {
    const now = new Date('2019-05-29 18:59:00').getTime();
    const clock = sinon.useFakeTimers(now);
    const res = await checkPlan(new Date());
    expect(res).toBe(false);
    clock.restore();
  });
});
