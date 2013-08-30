
/*
 * Send mail.
 */
var nodemailer = require("nodemailer"),
    fs = require('fs'),
    path = require('path'),
    mailHeaderFile = path.join(__dirname, '.', 'mailHeader.html'),
    mailFooterFile = path.join(__dirname, '.', 'mailFooter.html'),
    mailHeader = fs.readFileSync(mailHeaderFile, "utf8"),
    mailFooter = fs.readFileSync(mailFooterFile, "utf8");

/* 调试邮件内容
var emailfile = fs.createWriteStream('email.log', {flags: 'a'});
*/

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    /*host: "mail.ganji.com",
    port: 587,*/
    service: "Gmail",
    auth: {
        user: "hfutandyjang@gmail.com",
        pass: "zhbxtrgw"
    }
});

var emailsObj = {};

var testPassTml = function(emails, testUrl) {
    var html = '<tr><th style="vertical-align:middle;font-size:14px;text-align:left;padding:8px;border-right:1px solid #cae0fc;border-bottom:1px solid #cae0fc">测试用例地址：</th><td colspan="3" style="padding:8px;padding-right:18px;text-align:left;border-right:1px solid #cae0fc;font-family:tahoma;border-bottom: 1px solid #cae0fc;">  '+ testUrl +' </td><td style="padding:8px;padding-right:18px;text-align:left;font-family:tahoma;border-bottom: 1px solid #cae0fc;color: #468847;font-weight: bold;"> 全部通过 </td></tr>';

    emails.forEach(function(email) {
        if(!emailsObj[email]) {
            emailsObj[email] = "";
        }
        emailsObj[email] = emailsObj[email] + html; 
    });

    return html;
}

var testDetailTml = function(testsData, emails, testUrl) {
    var firstLine = '<tr><th style="vertical-align:middle;font-size:14px;text-align:left;padding:8px;border-right:1px solid #cae0fc;border-bottom:1px solid #cae0fc">测试用例地址：</th><td colspan="4" style="padding:8px;padding-right:18px;text-align:left;font-family:tahoma;border-bottom: 1px solid #cae0fc;"> '+ testUrl +' </td></tr>'

    var html = "";
    for(var key in testsData) {
        var testData = testsData[key];
        html += '<tr><td style="padding:8px;border-right:1px solid #cae0fc;border-bottom:1px solid #cae0fc;">'+ key +'</td><td style="padding:8px;padding-right:18px;border-right:1px solid #cae0fc;border-bottom:1px solid #cae0fc;text-align:left;font-family:tahoma">'+ testData.tests +'</td><td style="padding:8px;padding-right:18px;border-right:1px solid #cae0fc;border-bottom:1px solid #cae0fc;text-align:left;font-family:tahoma"> '+ testData.passes +' </td><td style="padding:8px;padding-right:18px;border-right:1px solid #cae0fc;border-bottom:1px solid #cae0fc;text-align:left;font-family:tahoma;color: #b94a48;"> '+ testData.failures +' </td><td style="padding:8px;padding-right:18px;border-right:1px solid #cae0fc;border-bottom:1px solid #cae0fc;text-align:left;font-family:tahoma"> '+ testData.pending +' </td></tr>';
    }
    html = firstLine + html;

    emails.forEach(function(email) {
        if(!emailsObj[email]) {
            emailsObj[email] = "";
        }
        emailsObj[email] = html + emailsObj[email]; 
    });

    return html;
}

exports.setMailData = function(testsData, emails, testUrl) { 
    for(var key in testsData) {
        var testData = testsData[key];
        if(testData.tests !== testData.passes) {
            testDetailTml(testsData, emails, testUrl);
            return ;
        }
    }
    testPassTml(emails, testUrl);
};

exports.sendMail = function() {
    console.log("开始分发邮件");
    var mailOptions = {
        from: "前端自动化测试 <f2eTEST@ganji.com>", // sender address
        subject: "前端测试报告 @" + new Date().toLocaleDateString() // Subject line\
    }
    for(var email in emailsObj) {
        mailOptions.to = email;
        mailOptions.html = mailHeader + emailsObj[email] + mailFooter;
        smtpTransport.sendMail(mailOptions, function(error, response){
            if (error){
                console.log(error);
            } else{
                console.log(email + " 邮件已经发送成功");
                console.log("Message sent: " + response.message);
            }
        });
    }
};