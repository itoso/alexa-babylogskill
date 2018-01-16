'use strict';

const aws = require('aws-sdk');
const Alexa = require('alexa-sdk');

const moment = require('moment-timezone');

// DynamoDB Configuration
const docClient = new aws.DynamoDB.DocumentClient({region: 'ap-northeast-1'});
const tableName = 'baby-log';
const partitionKey  = process.env.MODE;

// S3 Configuration
const s3 = new aws.S3({
    apiVersion: '2006-03-01',
    region: 'ap-northeast-1'
});
const bucket = process.env.BUCKET;
const key = 'baby-log/babylog.html';

const json2html = require('node-json2html');


// 多言語対応用
const languageStrings = {
    'ja': {
        translation: {
            WHAT_TO_LOG: '何を記録しますか',
            LOGGED_LACTATION_PRE: '授乳',
            LOGGED_LACTATION_POST: '分を記録しました',
            LOGGED_MILK_PRE: 'ミルク',
            LOGGED_MILK_POST: 'ミリリットルを記録しました',
            LOGGED_POO_PEE: 'うんちとおしっこを記録しました',
            LOGGED_PEE: 'おしっこを記録しました',
            LOGGED_POO: 'うんちを記録しました',
            LOGGED_BATH: 'お風呂を記録しました',
            DELETED_LAST_LOG: '最後の記録を削除しました',
            REPORT_UPDATED: 'レポートを更新しました',
            ERROR_MESSAGE: 'すみません、もう一度お願いします',
            STOP_MESSAGE: '終了します'
        }
    }
};


// ハンドラ(新規セッション用)
const newSessionHandlers = {
    
    'LaunchRequest': function() {
        this.emit(':tell', this.t("WHAT_TO_LOG"));
    },

    'LogLactationDurationIntent': function() {
        const lactationDurationISO = this.event.request.intent.slots.LactationDuration.value;
        const lactationDuration = moment.duration(lactationDurationISO).asMinutes();
        const datetime = moment().tz('Japan');
        logRecord(datetime,lactationDuration).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_LACTATION_PRE") + lactationDuration + this.t("LOGGED_LACTATION_POST"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'LogLactationDurationWithTimeIntent': function() {
        const lactationDurationISO = this.event.request.intent.slots.LactationDuration.value;
        const lactationDuration = moment.duration(lactationDurationISO).asMinutes();
        const time = this.event.request.intent.slots.Time.value;
        const datetime = getDatetime(time);
        logRecord(datetime,lactationDuration).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_LACTATION_PRE") + lactationDuration + this.t("LOGGED_LACTATION_POST"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },
    
    'LogMilkAmountIntent': function() {
        const milkAmount = this.event.request.intent.slots.MilkAmount.value;
        const datetime = moment().tz('Japan');
        logRecord(datetime,0,milkAmount).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_MILK_PRE") + milkAmount + this.t("LOGGED_MILK_POST"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },
    
    'LogMilkAmountWithTimeIntent': function() {
        const milkAmount = this.event.request.intent.slots.MilkAmount.value;
        const time = this.event.request.intent.slots.Time.value;
        const datetime = getDatetime(time);
        logRecord(datetime,0,milkAmount).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_MILK_PRE") + milkAmount + this.t("LOGGED_MILK_POST"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'LogPooIntent': function() {
        const datetime = moment().tz('Japan');
        logRecord(datetime,0,0,1,0).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_POO"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'LogPooWithTimeIntent': function() {
        const time = this.event.request.intent.slots.Time.value;
        const datetime = getDatetime(time);
        logRecord(datetime,0,0,1,0).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_POO"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'LogPeeIntent': function() {
        const datetime = moment().tz('Japan');
        logRecord(datetime,0,0,0,1).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_PEE"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'LogPeeWithTimeIntent': function() {
        const time = this.event.request.intent.slots.Time.value;
        const datetime = getDatetime(time);
        logRecord(datetime,0,0,0,1).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_PEE"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'LogPooPeeIntent': function() {
        const datetime = moment().tz('Japan');
        logRecord(datetime,0,0,1,1).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_POO_PEE"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'LogPooPeeWithTimeIntent': function() {
        const time = this.event.request.intent.slots.Time.value;
        const datetime = getDatetime(time);
        logRecord(datetime,0,0,1,1).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_POO_PEE"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'LogBathIntent': function() {
        const datetime = moment().tz('Japan');
        logRecord(datetime,0,0,0,0,1).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_BATH"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'LogBathWithTimeIntent': function() {
        const time = this.event.request.intent.slots.Time.value;
        const datetime = getDatetime(time);
        logRecord(datetime,0,0,0,0,1).then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("LOGGED_BATH"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'DeleteLastLogIntent': function() {
        deleteLastRecord().then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("DELETED_LAST_LOG"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'UpdateReportIntent': function() {
        updateReport().then(
            () => {
                console.log('Invoked');
                this.emit(':tell', this.t("REPORT_UPDATED"));
            },
            () => {
                console.log('Exception');
                this.emit(':tell', this.t("ERROR_MESSAGE"));
            }
        );
    },

    'AMAZON.HelpIntent': function() {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
};


// メイン処理
exports.handler = function(event, context) {
    const alexa = Alexa.handler(event, context);
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(newSessionHandlers);
    alexa.execute();
};


// 保存処理
//function logRecord(datetime,lactationDuration=0,milkAmount=0,hasPoo=0,hasPee=0,tookBath=0){
//    const record = datetime.format('YYYY-MM-DD') + "\t" +
//        datetime.format('HH:mm:ss') + "\t" +
//        lactationDuration + "\t" +
//        milkAmount + "\t" +
//        hasPoo + "\t" +
//        hasPee + "\t" +
//        tookBath + "\n";
//
//
//    // params for get operation
//    const getObjectParams = {
//        Bucket: bucket,
//        Key: key
//    };
//
//    return new Promise((resolve, reject) => {
//        s3.getObject(getObjectParams).promise()
//            .then(function(data){
//                // Build record and add to existing records
//                const body = data.Body + record;
//
//                // params for put operation
//                const putObjectParams = {
//                    Bucket: bucket,
//                    Key: key,
//                    Body: body,
//                    ContentType: 'text/tab-separated-values; charset=utf-8',
//                    ACL: 'public-read'
//                };
//
//                return s3.putObject(putObjectParams).promise();
//
//            })
//            .catch(function(err){
//                console.log(err);
//                const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
//                console.log(message);
//                reject(message);
//            })
//            .then(function(data) {
//                console.log('Uploaded successfully.');
//                console.log(data);
//                resolve();
//            })
//            .catch(function(err){
//                console.log('Error occuered when uploading to S3');
//                console.log(err, err.stack);
//                reject(err);
//                context.fail(err);
//            });
//    });
//};
//

// レコードを記録する
function logRecord(datetime,lactationDuration=0,milkAmount=0,hasPoo=0,hasPee=0,tookBath=0){
    const record = {
        "partitionKey" : partitionKey,
        "createdAt" : moment().valueOf(),
        "logDate" : datetime.format('YYYY-MM-DD'),
        "logTime" : datetime.format('HH:mm:ss'),
        "lactationDuration" : lactationDuration,
        "milkAmount" : milkAmount,
        "hasPoo" : hasPoo,
        "hasPee" : hasPee,
        "tookBath" : tookBath,
    }

    var params = {
        TableName: tableName,
        Item: record
    };

    return docClient.put(params).promise()
        .then( function(data){
            console.log(data);
        })
        .catch( function(err){
            console.log(err);
        });
}

// 最後に記録されたレコードを削除する
function deleteLastRecord(){

    var queryParams = {
        TableName: tableName,
        Limit: 1,
        KeyConditionExpression : "#k = :val",
        ExpressionAttributeValues : {":val" : partitionKey },
        ExpressionAttributeNames  : {"#k" : "partitionKey"},
        ProjectionExpression : "createdAt",
        ScanIndexForward : false
    };

    return docClient.query(queryParams).promise()
        .then( function(data){
            console.log(data);
            const createdAt = data.Items[0].createdAt;
            const deleteParams = {
                TableName: tableName,
                Key : {
                    "partitionKey" : partitionKey,
                    "createdAt" : createdAt
                }
            }
            console.log(deleteParams);
            return docClient.delete(deleteParams).promise();
        })
        .then(function(data){
            console.log("Delete result: "+ data);
        })
        .catch( function(err){
            console.log(err);
        });

}

// レコードを一括取得し、S3にアップロードする
function updateReport(){

    const queryParams = {
        TableName: tableName,
        KeyConditionExpression : "#k = :val",
        ExpressionAttributeValues : {":val" : partitionKey },
        ExpressionAttributeNames  : {"#k" : "partitionKey"},
        ProjectionExpression : "createdAt,logDate,logTime,lactationDuration,milkAmount,hasPee,hasPoo,tookBath",
        ScanIndexForward : false
    };

    return docClient.query(queryParams).promise()
        .then(function(data){
            // Build record and add to existing records
            const format = {
                '<>' : 'tr',
                'html': '<td>${createdAt}</td><td>${logDate}</td><td>${logTime}</td><td>${lactationDuration}</td><td>${milkAmount}</td><td>${hasPee}</td><td>${hasPoo}</td><td>${tookBath}</td>'
            };

            let body = '<html><body>'
            body += '<table border="1">';
            body += '<thead><tr><th>createdAt</th><th>logDate</th><th>logTime</th><th>lactationDurarion</th><th>milkAmount</th><th>hasPee</th><th>hasPoo</th><th>tookBath</th></tr></thead>'
            body += '<tbody>';
            body += json2html.transform(data.Items,format);
            body += '</tbody>';
            body += '</table>';
            body += '</body></html>';


            // params for put operation
            const putObjectParams = {
                Bucket: bucket,
                Key: key,
                Body: body,
                ContentType: 'text/html; charset=utf-8',
                ACL: 'public-read'
            };

            return s3.putObject(putObjectParams).promise();
        }).
        catch(function(err){
            console.log(err);
            return Promise().reject();
        });
}

// 指定された時刻から日時オブジェクトを作成する
function getDatetime(timeString){
    console.log('timeString: ' + timeString);
    let datetime = moment.tz(timeString,"HH:mm","Japan");
    if(datetime.isAfter()){
        datetime.subtract(1,'days');
    }
    return datetime;
}
