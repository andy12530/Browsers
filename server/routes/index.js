
/*
 * GET home page.
 */

var fs = require('fs'),
    path = require('path'),
    configFile = path.join(__dirname, '..', 'server-config.json'),
    config = JSON.parse(fs.readFileSync(configFile)),
    useragent = require('useragent'),
    qs = require('querystring'),
    request = require('request'),
    async = require('async');

var mail = require('./mail');

var mongo = require('mongoskin'),
    db = mongo.db(config.mongo + '/ganjiCI?auto_reconnect');

var openNum = 0,
    closeNum = 0,
    isEndTest = true,
    testsData = {};

var runTestCase = function(url) {
    isEndTest = false;
    openNum = 0;
    closeNum = 0;
    testsData = {};
    config.clients.forEach(function(client) {
        var openUrl = 'http://' + client + ':9997/restart?capture=' + url;
        request.get({url:openUrl, json:true}, function (err, r, b) {
            if(b.succ) {
                openNum += b.num;
            }
        });
    });
}

setInterval(function() {
    var curTime = new Date();
    //每小时检查是否已经到自动执行时间
    if(curTime.getHours() !== config.time) {
        return false;
    }

    //测试队列
    var q = async.queue(function(task, callback) {
            task(callback);
    }, 1);

    q.drain = function() {
        console.log("测试用例全部执行完毕")
        mail.sendMail();
    }

    db.collection('testcase').find().toArray(function (err, tests) {
        if(!err) {
            tests.forEach(function(test) {
                q.push(function(callback) {
                   runTestCase(test.url);
                   //检查测试是否执行完成
                    var checkEnd = setInterval(function() {
                        if(isEndTest) {
                            clearInterval(checkEnd);
                            mail.setMailData(testsData, test.email, test.url);
                            callback();
                        }
                    }, 1000);
                });
            });
        }
    });
}, 1000 * 3600);

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

exports.addTest = function(req, res) {
    var postData = req.body;
    postData.url = postData.url.trim();
    db.collection('testcase').findOne({url: postData.url}, function (err, test) {
        if(test) {
            console.log("The test has store in mongoDB");
            if(test.email.indexOf(postData.email[0]) !== -1 ) {
                return false;
            } else {
                test.email.push(postData.email[0]);
            }
            db.collection('testcase').update({url: postData.url}, { $set: {email: test.email} }, function(err , rs) {

            });
        } else {
           db.collection('testcase').insert(postData, function(err, result) {
                if(!err) {
                    console.log("the testcase has Recorded in mongoDB");
                }
            }); 
        }
    });

    runTestCase(postData.url);
    res.json({succ: 1});
};


exports.status = function(req, res, callback) {
    var data = req.body,
        reportServer = req.app.get('reportServer');
    if(!reportServer) {
        reportServer = [];
    }
    data.createTime = new Date().getTime();
    db.collection('report').insert(data, function(err, result) {
        if(!err) {
            console.log("Recorded the report data in mongoDB");
        }
    });

    var browserUA = useragent.parse(data.ua);
    data.browserFullName = browserUA.os.family + ' ' + browserUA.family + ' ' + browserUA.major;

    data.client = req.ip;
    testsData[data.browserFullName] = data.stats;
    //关闭浏览器
    var closeUrl = 'http://' + data.client + ':9997/delete?',
        params = {bName: browserUA.family.toLowerCase()};

    closeUrl += qs.stringify(params);
    request.get({url:closeUrl, json:true}, function (err, r, b) {
        if(b.succ) {
            closeNum++;
            console.log("success close the browser " + data.browserFullName);
        }

        if(closeNum === openNum) {
            reportServer.forEach(function(item){
                item.emit('reportEnd', {succ: 1});
            });
            isEndTest = true;
        }
    });
    reportServer.forEach(function(item){
        item.emit('report', data);
    });
};