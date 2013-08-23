$(function() {
var clients = $('#clients').val().split(',');

var reportTml = _.template('<div class="reporter-item" id="<%= browserId %>">'+
        '<hr>' +
        '<p title="<%= ua %>"> <strong>浏览器：</strong><span class="item-ua"><%= browserName %></span></p>' +
        '<p> <strong>当前状态：</strong>' +
            '<blockquote><ol class="item-status">' +
                '<li>测试开始运行</li>' +
                '<li>测试用例正在执行</li>' +
                '<li>测试执行结束</li>' +
                '<li class="text-success close-tip">浏览器已经正常关闭</li>' +
            '</ol></blockquote>' +
        '</p>' +
        '<p><strong>测试概况报告：</strong>' +
            '<blockquote><ul class="item-report list-unstyled"">' +
                '<li class="text-info">总共：<%= tests %></li>' +
                '<li class="text-success">通过：<%= passes %></li>' +
                '<li class="text-danger">失败：<%= failures %></li>' +
                '<li class="text-warning">挂起：<%= pending %></li>' +
                '<li class="text-info">耗时：<%= duration %> ms</li>' +
            '</ul></blockquote>' +
        '</p>' +
        '</div>' +
    '</div>');

var $reportEls = $('#report-content'),
    $reportTitle = $('#report-title'),
    reportIo,
    openNum = 0,
    closeNum = 0;

function createReport(data) {
    var report = data.stats,
        html = reportTml({
            browserId : data.browserId,
            ua: data.ua,
            browserName: data.browserFullName,
            tests: report.tests,
            passes: report.passes,
            failures: report.failures,
            pending: report.pending,
            duration: report.duration
        });
    $reportEls.append($(html));

    var link = $('<a href="#'+ data.browserId +'" style="margin-right: 20px;">'+ data.browserFullName +'测试结果</a>');
    $reportTitle.append(link);
}

$('#submit').on('click', function(e) {
    e.preventDefault();
    if($(this).prop('disabled')) {
        return false;
    }
    $(this).button('loading');
    if(!reportIo) {
        reportIo = io.connect(location.protocol + '//' + location.host + '/report');
    }

    var capture = $('#URI').val();

    //每次都会重新启动所有浏览器
    openNum = 0;
    $.each(clients, function(index) {
        var url = 'http://' + clients[index] +':9997/restart?callback=?';
        $.getJSON(url, {capture: capture}, function(data) {
            if(data.succ) {
                openNum += data.num;
            }
            reportIo.emit('openNum', {openNum: openNum});
        });
    });

    var title = $('<p>当前测试地址为：<a href="'+ capture +'" target="_blank">'+ capture +'</a></p>');
    $reportTitle.append(title);
});
reportIo = io.connect(location.protocol + '//' + location.host + '/report');
reportIo.on('report', function(data) {
    createReport(data);
});

reportIo.on('reportEnd', function(data) {
    //整个测试过程全部结束
    if(data.succ) {
        $('#submit').button('reset');
    }
});

});