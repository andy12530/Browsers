
/*
 * GET home page.
 */

var fs = require('fs'),
    path = require('path'),
    configFile = path.join(__dirname, '..', 'server-config.json'),
    config = JSON.parse(fs.readFileSync(configFile)),
    useragent = require('useragent'),
    qs = require('querystring'),
    request = require('request');

var mongo = require('mongoskin'),
    db = mongo.db(config.mongo + '/ganjiCI?auto_reconnect');

exports.index = function(req, res){
    res.render('index', {
        title: '浏览器监控平台',
        clients: config.clients,
        className: ['', '']
    });
};

exports.run = function(req, res) {
    res.render('execScript', {
        title: '执行测试用命',
        clients: config.clients,
        className: ['active', '']
    });
};

exports.status = function(req, res) {
    var data = req.body,
        reportServer = req.app.get('reportServer');
    db.collection('report').insert(data, function(err, result) {
        if(!err) {
            console.log("Recorded the report data in mongoDB");
        }
    });

    var browserUA = useragent.parse(data.ua);
    data.browserFullName = browserUA.os.family + ' ' + browserUA.family + ' ' + browserUA.major;


    data.client = req.ip;
    //关闭浏览器
    var closeUrl = 'http://' + data.client + ':9997/delete?',
        params = {bName: browserUA.family.toLowerCase()};

    closeUrl += qs.stringify(params);
    request.get({url:closeUrl, json:true}, function (err, r, b) {
        var curCloseNum = req.app.get('closeNum'),
            openNum = req.app.get('openNum');
        if(b.succ) {
            if(!curCloseNum) {
                curCloseNum = 1;
            } else {
                curCloseNum++;
            }
            req.app.set('closeNum', curCloseNum);
            console.log("success close the browser " + data.browserFullName);
        }

        if(curCloseNum === openNum) {
            req.app.set('closeNum', 0);
            reportServer.forEach(function(item){
                item.emit('reportEnd', {succ: 1});
            });
        }
    });
    reportServer.forEach(function(item){
        item.emit('report', data);
    });
};