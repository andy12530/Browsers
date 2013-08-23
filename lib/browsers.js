var fs = require('fs'),
    async = require('async'),
    path = require('path'),
    rimraf = require('rimraf'),
    log = require('little-logger'),
    logger = new log.Logger();

var Launcher = require('./launcher').Launcher,
    BaseBrowser = require('./launchers/Base'),
    Service = require('./service');

var defaultBrowsrs = ['Chrome', 'Firefox', 'Opera', 'Safari', 'IE'];
var validBrowsers = (function() {
    return defaultBrowsrs.filter(function(name) {
        var lanuchScript = require('./launchers/' + name);
        var bPath = lanuchScript.prototype.DEFAULT_CMD[process.platform];
        return fs.existsSync(bPath);
    }).map(function(bName) {
        return bName.toLowerCase();
    });
}());


exports.run = function(cfg) {
    var configFile = path.join(__dirname, '..', 'browsers-config.json');
    var browsersConfig = JSON.parse(fs.readFileSync(configFile));
    require('totoro-common').mix(cfg, browsersConfig);
    
    var browsers = cfg.browsers;
    if (browsers) {
        browsers.forEach(function(bName) {
            bName = bName.toLowerCase();
            if (validBrowsers.indexOf(bName) < 0) {
                logger.error('Check in the browser ' + bName + ' install path!');
            }
        });
        cfg.browsers = browsers;
    } else {
        cfg.browsers = validBrowsers;
    }

    var launcher = new Launcher(cfg);

    var q = async.queue(function(task, callback) {
        task(callback);
    }, 1);

    q.drain = function() {
        logger.info('browsers server start...')
    };
    // clean temp dir
    q.push(function(callback) {
        var tempDir = path.dirname(BaseBrowser.tempDir);
        var baseName = path.basename(BaseBrowser.tempDir);

        fs.readdirSync(tempDir).forEach(function(filename) {
            var file = path.join(tempDir, filename);
            if (file.indexOf(baseName) > -1) {
                rimraf(file, function() {});
            }
        });
        callback();
    });

    // 1. 加载 Node 本身管理服务(浏览器打开, 关闭，重启等)
    // 2. 加载管理服务, 监听相关注册信息
    q.push(function(callback) {
        Service.createLocal(launcher, cfg, callback);
    });

    // 3. 主动探测系统浏览器信息
    q.push(function(callback) {
        require('./browsers-info').run(launcher, cfg, callback);
    });
    // 4. 检查用户配置，如果无配置注册所有浏览器信息到 hub
    // 5. 监听 totoro-test
    /*q.push(function(callback) {
        require('./register').run(launcher, cfg, callback)
    });*/    
    q.push(function(callback) {
        require('./memory').run(launcher, cfg, callback);
    });

    q.push(function(callback) {
        require('./monitor').run(launcher, cfg, callback);
    });    
    // launcher.launch(['Chrome', 'Firefox', 'Safari', 'Opera'], 'localhost:9000', 300000, 4);
    // browsers = launcher.launch(browsers, cfg);

    /*process.on('uncaughtException', function(err) {
        logger.error(err);
        logger.info(err.stack);
    });*/

    process.on('SIGINT', function() {
        logger.debug('Got SIGINT.');
        launcher.kill();
        process.exit(0);
    })
};
