'use strict';

const aws = require('aws-sdk');
const Alexa = require('alexa-sdk');

const moment = require('moment-timezone');

// S3 Configuration
const s3 = new aws.S3({
    apiVersion: '2006-03-01',
    region: 'ap-northeast-1'
});
const bucket = process.env.BUCKET;
const key = 'baby-log/babylog.tsv';

// 多言語対応用
const languageStrings = {
    'ja': {
        translation: {
            WHAT_TO_LOG: '何を記録しますか',
            LOGGED_LACTATION_PRE: '授乳',
            LOGGED_LACTATION_POST: '分を記録しました',
            LOGGED_MILK_PRE: 'ミルク',
            LOGGED_MILK_POST: 'ミリリットルを記録しました',
            LOGGED_POO_PEE: 'おしっこ と うんちを記録しました',
            LOGGED_PEE: 'おしっこを記録しました',
            LOGGED_POO: 'うんちを記録しました',
            LOGGED_BATH: 'お風呂を記録しました',
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
function logRecord(datetime,lactationDuration=0,milkAmount=0,hasPoo=0,hasPee=0,tookBath=0){
    const record = datetime.format('YYYY-MM-DD') + "\t" +
        datetime.format('HH:mm:ss') + "\t" +
        lactationDuration + "\t" +
        milkAmount + "\t" +
        hasPoo + "\t" +
        hasPee + "\t" +
        tookBath + "\n";


    // params for get operation
    const getObjectParams = {
        Bucket: bucket,
        Key: key
    };

    return new Promise((resolve, reject) => {
        s3.getObject(getObjectParams).promise()
            .then(function(data){
                // Build record and add to existing records
                const body = data.Body + record;

                // params for put operation
                const putObjectParams = {
                    Bucket: bucket,
                    Key: key,
                    Body: body,
                    ContentType: 'text/tab-separated-values; charset=utf-8',
                    ACL: 'public-read'
                };

                return s3.putObject(putObjectParams).promise();

            })
            .catch(function(err){
                console.log(err);
                const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
                console.log(message);
                reject(message);
            })
            .then(function(data) {
                console.log('Uploaded successfully.');
                console.log(data);
                resolve();
            })
            .catch(function(err){
                console.log('Error occuered when uploading to S3');
                console.log(err, err.stack);
                reject(err);
                context.fail(err);
            });
    });
};

function getDatetime(timeString){
    console.log('timeString: ' + timeString);
    let datetime = moment.tz(timeString,"HH:mm","Japan");
    if(datetime.isAfter()){
        datetime.subtract(1,'days');
    }
    return datetime;
}
