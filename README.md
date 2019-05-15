## 第三方集成

`dependencies`

- [antd]() - 蚂蚁金服推出的 UI 框架
- [node-schedule]() - 定时任务处理
- [bluebird, download, file-system]() - 文件系统操作，异步处理以及资源下载
- [isomorphic-fetch]() - 解决 fetch 在某些环境下的缺失问题，理解为是一个 polyfill
- [howler]() - 音频文件封装对象
- [nedb]() - 本地数据库，简单易用

`devDependencies`

- [debug]() - 调试框架
- [sinon]() - 间谍函数库，hack 执行过程

## 安装

准备工作

1.提升 github 访问速度：https://blog.csdn.net/lixq05/article/details/80778965 2.安装 nodejs，建议 version>=10 3.推荐使用`yarn`

执行过程

1.执行`ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/ yarn --registry=https://registry.npm.taobao.org`，使用淘宝镜像库 2.`yarn start`
