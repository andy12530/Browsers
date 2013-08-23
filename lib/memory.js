var os = require('os'),
    async = require('async'),
    log = require('little-logger'),
    logger = new log.Logger();

// 内存相关服务和监控
exports.run = function(launcher, opts, callback) {
    var memory, computeTimeout,
        allBrowsers = launcher.browsers;
    function computeMemory(callback) {
        callback = callback || function() {};

        if (computeTimeout) {
            callback(memory || {});
            return;
        }

        computeTimeout = setTimeout(function() {
            memory = {}, memory.browsers = {};
            async.forEachSeries(allBrowsers, function(b, callback) {
                if (memory.browsers[b.name]) {
                    callback();
                }
                b.getMemory(function(m) {
                    var bName = b.name.toLowerCase();
                    memory.browsers[bName] = m;
                    // check memory
                    launcher.checkMemory(b.name, m);
                    callback();
                });
            }, function() {
                // 添加系统内存使用情况
                var freemem = os.freemem(),
                    totalmem = os.totalmem(),
                    usedmem = totalmem - freemem;

                memory.totalmem = Math.round(totalmem / (1024 * 1024)) + 'M';
                memory.usedmem = Math.round(usedmem / (1024 * 1024)) + 'M';
                callback(memory);
            });

            computeTimeout = null;
        }, 5000);
    }

    setInterval(function() {
        if (opts.connected) {
            computeMemory();
        }
    }, 5000);

    var io = opts.io;

    io.sockets.on('connection', function(socket) {
        socket.on('memory', function() {
            computeMemory(function(memory) {
                socket.emit('memory', memory);
            });
        });
    });
    callback();
};
