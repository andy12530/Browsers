var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    fs = require('fs'),
    useragent = require('useragent'),
    path = require('path'),
    app = express(),
    accessLogfile = fs.createWriteStream('access.log', {flags: 'a'});

var configFile = path.join(__dirname, './', 'server-config.json');
var config = JSON.parse(fs.readFileSync(configFile));
var server = http.createServer(app);
// all environments
app.set('port', config.port || 4573);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.logger({stream: accessLogfile}));
app.use(express.static(path.join(__dirname, 'public')));
app.configure('development', function(){
    app.use(express.errorHandler());
    app.locals.pretty = true
});

app.get('/', routes.index);
app.get('/run', routes.run);
app.post('/status', routes.status);


server.listen(app.get('port'), function(){
    console.log('Client Express listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server),
    reportServer = [];

io.configure('development', function(){
    io.set('log level', 2);
});

io.of('/report').on('connection', function (socket) {
    reportServer.push(socket);
    app.set('reportServer', reportServer);

    socket.on('openNum', function(data) {
        app.set("openNum", data.openNum);
        console.log(data);
    });
});