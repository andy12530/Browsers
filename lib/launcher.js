var events = require('events'),
    util = require('util'),
    log = require('little-logger'),
    logger = new log.Logger();
    async = require('async'),
    helper = require('./helper');


var Launcher = function(opts) {
    var browsers = this.browsers = [];
    var BrowsersMapping = {};

    this.opts = opts;
    var maxMemory = opts.maxMemory;
    var that = this;
    function emptyFn() {}

    this.launch = function(names, captureUrl) {
        if (opts.connected === false) {
            return;
        }
        var _browsers = this.getBrowsers(names) || browsers;
        if (!captureUrl && !opts.capture) {
            captureUrl = 'http://127.0.0.1:' + opts.port + '/version';
        } else if (opts.capture) {
            captureUrl = opts.capture;
        }

        _browsers.forEach(function(browser) {
            //logger.info('Starting browser ' + browser.name + ' open ' + captureUrl);
            browser.start(captureUrl);
        });

        return _browsers;
    };

    // 获取用户指定的浏览器实例
    this.getBrowsers = function(names) {
        if (!(Array.isArray(names) || helper.isString(names))) {
            return null;
        }

        if (helper.isString(names)) {
            names = [names];
        }

        return names.map(function(name) {
                name = name.toLowerCase();

                if (BrowsersMapping[name]) {
                    return BrowsersMapping[name];
                }

                var lanuchScript = require('./launchers/' + name) || require('./launchers/Script');
                var browser = new lanuchScript();
                browsers.push(browser);

                return BrowsersMapping[name] = browser;
            });
    };

    function find(browserName, callback) {
        var isFind = false;
        browsers.forEach(function(browser) {
            if (browser.is(browserName)) {
                isFind = true;
                callback(browser);
            }
        });
        return isFind;
    }


    function _parseArgs(names, callback) {
        var defaultBrowsers = opts.browsers;

        if (arguments.length === 1 && isFunction(names)) {
            callback = names;
            names = defaultBrowsers;
        } else {
            names = names || defaultBrowsers;
            callback = callback || emptyFn;
        }

        return [names, callback];
    }

    this.kill = function(names, callback) {
        var args = _parseArgs.apply(this, arguments);
        names = args[0];
        callback = args[1];

        var _browsers = [];

        find(names, function(browser) {
            _browsers.push(browser);
        });

        async.forEach(_browsers, function(browser, callback) {
            logger.debug('Disconnecting ' + browser.name);
            browser.kill(callback);
        }, function() {
            callback && callback();
        });
    };

    // 重启指定的浏览器
    this.restart = function(names, callback) {
        var args = _parseArgs.apply(this, arguments);
        names = args[0];
        callback = args[1];
        logger.info('restart browsers ' + names);
        this.kill(names, function() {
            that.launch(names);
            callback && callback();
        });
    };

    var memoryRestartTimeout = null;

    this.checkMemory= function(browserName, m) {
        m = parseInt(m, 10);
        /*if (m > maxMemory) {
            logger.warn('The browser ' + browserName + ' memory use too much ' + m + 'M')
            if (memoryRestartTimeout) return

            memoryRestartTimeout = setTimeout(function() {
                that.restart(browserName)
                memoryRestartTimeout = null
            }, 10000)
        }*/
    };

    this.findBrowserById = function(id) {
        return this.getBrowsers(opts.browsers).filter(function(browser) {
            return browser.is(id);
        }).map(function(b) {
            return b.name;
        });
    };

    // register events
    this.on('exit', this.kill);
};


util.inherits(Launcher, events.EventEmitter);

function isFunction(obj) {
    return typeof obj === 'function';
}

// PUBLISH
exports.Launcher = Launcher;
