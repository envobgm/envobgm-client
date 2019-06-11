/* eslint-disable prefer-rest-params */
import message from 'antd/lib/message';
import netUtil from '../netUtil';
import httpStatusCodes from '../../constants/http-status-code';
import routes from '../../constants/routes';
import { history } from '../../store/configureStore';

const debug = require('debug')('apiProxy');

export default function proxy() {
  return new Proxy(netUtil.fetchRequest, {
    async apply() {
      const data = await Reflect.apply(...arguments);
      debug('返回结果，并检查和处理错误信息...');
      // if (data.errorMessage) {
      //   message.error(data.errorMessage);
      //   throw new Error(data.errorMessage);
      // }
      switch (data.status) {
        case httpStatusCodes.SERVER_ERROR: {
          message.error(data.errorMessage);
          throw new Error(data.errorMessage);
        }
        case httpStatusCodes.OPTION_FAILED: {
          message.error(data.errorMessage);
          throw new Error(data.errorMessage);
        }
        case httpStatusCodes.PARAM_ERROR: {
          message.error(data.errorMessage);
          throw new Error(data.errorMessage);
        }
        case httpStatusCodes.STS_GET_FAILED: {
          message.error(data.errorMessage);
          throw new Error(data.errorMessage);
        }
        case httpStatusCodes.NO_PLAYER_INFO: {
          message.error(data.errorMessage);
          throw new Error(data.errorMessage);
        }
        case httpStatusCodes.UNAUTHORIZED: {
          message.error(data.errorMessage);
          history.push(routes.ACTIVE);
          break;
        }
        case httpStatusCodes.ACTIVATED: {
          message.error(data.errorMessage);
          history.push(routes.HOME);
          break;
        }
        default:
      }
      return data;
    }
  });
}
