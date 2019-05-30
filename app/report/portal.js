import { reportToPortal } from '../api';

export default function start() {
  onmessage = async function(event) {
    await reportToPortal(event.data);
  };
}

start();
