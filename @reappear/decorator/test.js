// @see https://www.cnblogs.com/jiasm/p/9281113.html

/* eslint-disable class-methods-use-this */
class Model1 {
  getData() {
    // 此处省略获取数据的逻辑
    return [
      {
        id: 1,
        name: 'Niko'
      },
      {
        id: 2,
        name: 'Bellic'
      }
    ];
  }
}

function wrap(Model, key) {
  // 获取Class对应的原型
  const target = Model.prototype;

  // 获取函数对应的描述符
  const descriptor = Object.getOwnPropertyDescriptor(target, key);

  // 生成新的函数，添加耗时统计逻辑
  const log = function(...arg) {
    const start = new Date().valueOf();
    try {
      return descriptor.value.apply(this, arg); // 调用之前的函数
    } finally {
      const end = new Date().valueOf();
      console.log(`start: ${start} end: ${end} consume: ${end - start}`);
    }
  };

  // 将修改后的函数重新定义到原型链上
  Object.defineProperty(target, key, {
    ...descriptor,
    value: log // 覆盖描述符重的value
  });
}

wrap(Model1, 'getData');
// wrap(Model2, 'getData');

// start: XXX end: XXX consume: XXX
console.log(new Model1().getData()); // [ { id: 1, name: 'Niko'}, { id: 2, name: 'Bellic' } ]
// start: XXX end: XXX consume: XXX
// console.log(Model2.prototype.getData()); // [ { id: 1, name: 'Niko'}, { id: 2, name: 'Bellic' } ]
