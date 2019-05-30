let i = 0;

function timedCount() {
  i += 1;
  console.log(i);
  postMessage(i); // 向其他窗口或者页面发送消息
  onmessage = function(event) {
    console.debug('接收信息', event.data);
  };
  setTimeout(timedCount, 1000);
}

timedCount();
