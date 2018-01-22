import _ from "lodash";
import $ from "jquery";
import { Webiny } from "./../../index";
import platform from "platform";

class Logger {
    constructor() {
        // config
        this.postInterval = 1000; // milliseconds

        // internals
        this.errors = [];
        this.errorHashMap = [];
        this.clientInfo = this.getClientInfo();
        this.interval = null;
    }

    startLogging() {
        // assign error handlers
        this.errorHandler();

        // start the interval
        this.startInterval();
    }

    errorHandler() {
        // javascript system errors
        window.onerror = (msg, url, line, columnNo, error) => {
            this.reportError("js", msg, error.stack);
        };

        // API response errors
        Webiny.Http.addResponseInterceptor(response => {
            if (response.status !== 200) {
                // we want to log only responses that are not valid JSON objects
                // 5xx response with a valid JSON object is probably an expected exception
                try {
                    if (typeof response.data === "string") {
                        JSON.parse(response.data);
                    }

                    // if the status code is 503 and has errorCode of w1, it's a PHP error (this is caught by PHP logger)
                    // in that case we just want to inform the user with a growl notification
                    if (response.status === 503 && response.data.code === "W1") {
                        Webiny.Growl.danger(response.data.message, "System Error", false, 10000);
                    }
                } catch (e) {
                    this.reportError(
                        "api",
                        response.data,
                        response.request.body,
                        response.request.method + " " + response.request.url
                    );
                }
            }

            return response;
        });
    }

    reportError(type, msg, stack, url = null) {
        const date = new Date();
        const errorHash = this.hashString(msg + url);
        url = _.isNull(url) ? location.href : url;

        if (this.errorHashMap.indexOf(errorHash) < 0) {
            this.errors.push({
                type,
                msg,
                url,
                stack,
                date
            });
            this.errorHashMap.push(errorHash);
        }
    }

    getClientInfo() {
        return {
            date: new Date(),
            browserName: platform.name,
            osName: platform.os.name,
            screenWidth: window.screen.availWidth,
            screenHeight: window.screen.availHeight
        };
    }

    startInterval() {
        this.interval = setInterval(() => {
            this.pushErrors();
        }, this.postInterval);
    }

    stopInterval() {
        clearInterval(this.interval);
    }

    pushErrors() {
        if (this.errors.length > 0) {
            this.stopInterval();
            $.ajax({
                method: "POST",
                url: Webiny.Config.Api.Url + "/entities/webiny/logger-error-group/save-report",
                data: { errors: this.errors, client: this.clientInfo }
            }).done(() => {
                this.errors = [];
                this.errorHashMap = [];
                this.startInterval();
            });
        }
    }

    hashString(str) {
        let hash = 0;
        if (str.length === 0) {
            return hash;
        }
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
}

export default Logger;
