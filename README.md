## Browsers模块
### 简介
简单的前端自动化测试工具。

* 支持多种浏览器。服务端可以管理各浏览器(Chrome, IE, firefox等)，实现重启与关闭；
* 多平台，跨系统。支持不同操作系统，运行守护程序，可以由服务端统一管理；
* 真实的浏览器环境。服务端发送测试用例url，守护程序驱动真实的浏览器，运行测试用例；
* 实时反馈。测试用例运行时，实时反馈测试结果，收集测试报告并即时显示测试结果概况；
* 自动化运行。每天定时运行数据库中已登记的所有测试用例记录，整理测试报告；
* 支持邮箱订阅。在提交测试用例时可以选择订阅，每天定时发送测试结果概况至订阅邮箱；


### 安装
* Node.JS最新版
* 安装模块依赖 
* * 下载代码并解压，进入browsers目录，运行：<code>npm install</code>;
* * 进入browsers/server目录，运行：<code>npm install</code>;

### 客户端配置
* 打开<code>browsers-config.json</code>文件可以修改监听端口，默认为9997；
* 打开<code>lib/launchers</code>目录下的Chrome,js, IE.js，修改浏览器的安装位置：

```javascript
helper.extend(ChromeBrowser.prototype, {
  name: 'Chrome',
  DEFAULT_CMD: {
    linux: 'google-chrome',
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    win32: 'C:\\Users\\zhangbingbing.GANJI\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
  },
  ENV_CMD: 'CHROME_BIN'
})
```
### 服务端配置
* 文件<code>server/server-config.json</code>文件用来配置服务端，其中服务端默认监听端口为4573， clients为客户端的IP地址，mongo为MongoDB连接地址。

### 快速上手
1. 启动客户端浏览器守护程序<code>supervisor browsers</code>
2. 启动服务端，进入server目录下，运行<code>supervisor app</code>，用浏览器打开 http://localhost:4573

如果一切配置的没有问题，你会看到浏览器管理界面：

![浏览器管理页面][1]

在执行测试页面，提交testcase页面URL，服务端会让所有可用浏览器运行测试用例，收集测试结果存储并发回给当前页面：

![测试用例运行界面][2]


  [1]: http://git.corp.ganji.com/zhangbingbing/browsers/raw/master/img/1.png
  [2]: http://git.corp.ganji.com/zhangbingbing/browsers/raw/master/img/2.png