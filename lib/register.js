var http = require('http'),
    log = require('little-logger'),
    logger = new log.Logger();

exports.run = function(launcher, opts, callback) {
    var running = false;
    var checkCapture = function() {
        logger.debug('capture check ......' + opts.capture);
        http.get(opts.capture, function(res) {
            logger.debug('captureTotoro STATUS: ' + res.statusCode);
            if (res.statusCode > 199 && res.statusCode < 400) {
                if (!running) {
                    launcher.launch(null, opts.capture)
                    running = true
                }
            }
        }).on('error', function(e) {
            if (running) {
                launcher.kill(function() {
                    running = false
                })
            }
        })
    }

    checkCapture()

    setInterval(checkCapture, 1 * 1000)
    callback()
}
