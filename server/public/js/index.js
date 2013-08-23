$(function() {
//加载相关启动信息
var tml = _.template('<tr class="<%= name %>">' +
        '<td><%= index %></td>' +
        '<td title="<%= browserDetail %>"><%= browserInfo %></td>' +
        '<td>' +
          '<% for(var i = 0; i< browserNum; i++) { %>' +
            '<img src="img/<%= name %>.png">' +
          '<% } %>' +
        '</td>' +
        '<td class="mem">' +
          '0 M' +
        '</td>' +
        '<td style="width: 26%;">' +
          '<button type="button" class="btn btn-small btn-primary" data-loading-text="重启中..." data-action="restart">重启</button>' +
          '<button type="button" class="btn btn-small btn-danger" data-loading-text="关闭中..." style="margin-left: 20px;" data-action="delete">关闭</button>' +
        '</td>' +
    '</tr>');
var $tableContents = $('#clients .client');

// the browsers Info
$.each($tableContents, function() {
    var self = $(this), clientIp = self.data('client'), tbody = self.find('tbody');
    var updateTbody = function() {
        $.getJSON('http://'+ clientIp +':9997/browsers?callback=?', function(data) {
            var html = "", index = 0;
            $.each(data, function(key, obj) {
                index++;
                html += tml({
                  name: key,
                  index: index,
                  browserInfo: obj.value,
                  browserDetail: obj.agent,
                  browserNum: 1
                });
            });
            tbody.html(html);
        });
    }
    updateTbody();

    // update the memory;
    var socket = io.connect(location.protocol + '//' + clientIp + ':' + '9997'),
        memoryEl = self.find('.memory');

    socket.on('memory', function(data) {
      var html = "系统总共内存为：" + data.totalmem + ", 当前已用内存为：" + data.usedmem;
      memoryEl.html(html);
      //内存信息
      $.each(data.browsers, function(key, value) {
        tbody.find('.'+key+' .mem').html(value);
      });
    });

    setInterval(function() {
        socket.emit('memory');
    }, 3000);
    setInterval(function() {
      updateTbody();
    }, 1000 * 120);
});


//add the Event;
$tableContents.on('click', 'button', function(e) {
    var self = $(this), clientIp = $(this).parents('table').data('client');
    e.preventDefault();
    self.button('loading');
    var action = $(this).data('action'),
        bName = $(this).parents('tr').attr('class');
    if(action) {
        $.getJSON('http://'+ clientIp +':9997/'+ action + '?callback=?', {bName: bName}, function(data) {
            self.button('reset');
        });
    }
});

});