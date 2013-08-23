var fs = require('fs'),
    http = require('http'),
    path = require('path'),
    express = require('express'),
    useragent = require('useragent'),
    log = require('little-logger'),
    logger = new log.Logger();

exports.createLocal = function(launcher, opts, callback) {
    var browsersMapping = opts.browsersMapping = {};

    var app = express(),
        server = http.createServer(app);

    app.use(express.static(path.join(__dirname, '../static')));
    app.use(express.bodyParser());
    app.set('views', path.join(__dirname, '../static'));
    app.set('view engine', 'jade');
    app.configure('development', function(){
        app.use(express.errorHandler());
        app.locals.pretty = true;
    });

    app.get('/', function(req, res) {
        // 1. 显示当前系统有效的浏览器
        // 2. 显示当前已经启动的浏览器
        // 3. 页面中增加减少和添加浏览器操作
        res.render('index');
    });

    //以下为运行的API
    app.get('/browsers', function(req, res) {
        var browsers = opts.browsers;

        browsers.forEach(function(b) {
            b = b.toLowerCase();
            if(browsersMapping[b].launchedNum === undefined) {
                browsersMapping[b].launchedNum = 0;
            }
        });
        // 返回当前浏览器状态
        // browsers 为守护的浏览器
        // launchedBrowsers 已经启动浏览器个数
        res.jsonp(browsersMapping);
    });

    app.get('/delete', function(req, res) {
        var bName = req.query.bName;
        browsersMapping[bName].launchedNum = 0;
        launcher.kill(bName, function(err) {
            if (err) {
                res.jsonp({succ: 0, err: err})
            } else {
                res.jsonp({succ: 1})
            }
        })
    });

    app.get('/restart', function(req, res) {
        var bName = req.query.bName,
            capture = req.query.capture,
            num = 1;

        if(!bName) {
            num = opts.browsers.length;
            for(item in browsersMapping) {
                browsersMapping[item].launchedNum = 1;
            }
        } else {
            browsersMapping[bName] = 1;
        }
        opts.capture = capture;
        launcher.restart(bName, function(err) {
            if (err) {
                res.jsonp({succ: 0, msg: 'restart error', err: err});
            } else {
                res.jsonp({succ: 1, num: num});
            }
        });
    });

    app.get('/version', function(req, res) {
        var agent = req.headers['user-agent'],
            bInfo = useragent.parse(agent),
            bName = bInfo.family.toLowerCase();
        browsersMapping[bName] = {
            value: bInfo.toString(),
            agent: agent
        };
        res.send(JSON.stringify(bInfo));
    });

    server.listen(opts.port, function() {
        //console.log("express Local's server has start ...");
        callback();
    });

    var io = opts.io = require('socket.io').listen(server);

    io.configure('development', function(){
        io.set('log level', 2);
    });
};