import assert from 'assert';
import webdriver from 'selenium-webdriver';
import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import moment from 'moment';
import mkdirp from 'mkdirp';

class TestSuite {

    constructor() {
        this.testFailing = false;
        this.suiteName = null;
        this.testName = null;
        this.testTempFolder = null;

        const configPath = process.env.PWD + '/Tests/config.json';
        if (fs.existsSync(configPath)) {
            this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        this.initDriver();
        this.setupCallbacks();
    }

    setTestIsFailing() {
        this.testFailing = true;
    }

    getTestIsFailing() {
        return this.testFailing;
    }

    setTestName(suiteName, testName) {
        this.testName = testName;
        this.suiteName = suiteName;

        // each time we update the test name, we have to refresh the test temp folder
        this._createTestTempFolder();
    }

    loadData(path) {
        if (fs.existsSync(path)) {
            return JSON.parse(fs.readFileSync(path, 'utf8'));
        }
        return null;
    }

    getConfig(key) {
        if (!key) {
            return this.config;
        }

        if (_.isUndefined(this.config) || _.isUndefined(this.config[key])) {
            return null;
        }

        return this.config[key];
    }

    initDriver() {
        if (_.isUndefined(this.driver)) {
            const browserName = _.get(this.getConfig('webDriver'), 'browser', 'chrome');
            this.driver = new webdriver.Builder().forBrowser(browserName).build();
        }
    }

    getDriver() {
        return this.driver;
    }

    setupCallbacks() {
        after(function (done) {
            ts.getDriver().quit().then(done);
        });

        afterEach(function () {
            if (this.currentTest.state == 'failed') {
                // mark that the test is failing, so we write the log after the test
                ts.setTestIsFailing();

                ts.setTestName(this.currentTest.parent.fullTitle(), this.currentTest.title);

                // save screenshot and log data
                ts.saveScreenshotAndLogData();
            }
        });
    }

    saveScreenshotAndLogData() {
        const tempFolder = _.get(ts.getConfig('webDriver'), 'tempFolder', false);
        if (!tempFolder) {
            console.log('Unable to save screenshot because webDriver.tempFolder is not defined in mocha config.');

            return false;
        }

        // we only create the test folder when the test is failing
        const testTempFolder = this.testTempFolder;
        if (!fs.existsSync(testTempFolder)) {
            mkdirp(testTempFolder);
        }

        const imageName = 'screenshot.png';

        ts.getDriver().takeScreenshot().then(
            (image, err) => {
                require('fs').writeFile(testTempFolder + '/' + imageName, image, 'base64', function (err) {
                    console.log(err);
                });
            }
        );

        const logName = 'console.log';

        ts.getDriver().manage().logs().get('browser', 'debug')
            .then(function (entries) {
                let consoleLog = "";
                entries.forEach(function (entry) {
                    consoleLog += "[" + entry.level.name + "] " + entry.message + "\n";
                });

                require('fs').writeFile(testTempFolder + '/' + logName, consoleLog);
            });
    }

    login() {
        // open login page
        describe('Login Page', function () {

            this.timeout(_.get(ts.getConfig('login'), 'timeout', 2000));

            it('should login into dashboard', function (done) {

                ts.getDriver().get('http://demo.app/admin/login').then(function () {
                    ts.getDriver().wait(webdriver.until.elementLocated({xpath: '/html/body/webiny-app/rad-placeholder/webiny-form-container/div/div/form/layout/div[3]/div/input'})).then(function () {
                        // populate email input
                        const emailInput = ts.getDriver().findElement({xpath: '/html/body/webiny-app/rad-placeholder/webiny-form-container/div/div/form/layout/div[3]/div/input'});
                        emailInput.sendKeys(_.get(ts.getConfig('login'), 'username', 'missing@username'));

                        // populate password input
                        const passwordInput = ts.getDriver().findElement({xpath: '/html/body/webiny-app/rad-placeholder/webiny-form-container/div/div/form/layout/div[4]/div/input'});
                        passwordInput.sendKeys(_.get(ts.getConfig('login'), 'password', 'missing@password'));

                        // submit form
                        ts.getDriver().findElement({className: 'btn btn-lg btn-primary'}).click().then(function () {
                            ts.getDriver().wait(webdriver.until.elementLocated({id: 'left-sidebar'})).then(function () {
                                done();
                            });
                        });
                    });
                });
            });
        });
    }

    _createTestTempFolder() {
        // based on the test name, we define the tempFolder where we store the screeenshots and the console logs
        const tempFolder = _.get(ts.getConfig('webDriver'), 'tempFolder', false);
        if (!tempFolder) {
            console.log('Temp folder (webDriver.tempFolder) is not defined in mocha config therefore no screenshots and console logs will be saved');

            return false;
        }

        const suiteName = this.suiteName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
        const testName = this.testName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
        this.testTempFolder = tempFolder + '/' + moment().format('YYYY-MM-DD-HH-mm-ss') + '/' + suiteName + '/' + testName;
    }
}


export default {
    TestSuite: new TestSuite(),
    By: webdriver.By,
    until: webdriver.until,
    webdriver,
    assert
};