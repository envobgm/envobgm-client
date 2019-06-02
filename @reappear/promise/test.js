const error = true;

async function asyncFn() {
  if (error) {
    return Promise.reject(new Error('fail'));
  }
  return Promise.resolve('success');
}

(function() {
  asyncFn().catch(e => {
    console.info('预期报错');
    console.error(e);
  });
})();
