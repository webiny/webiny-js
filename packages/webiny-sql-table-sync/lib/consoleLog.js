"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

var _log = require("./log");

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ConsoleLog extends _log2.default {
    constructor(message, data, tags) {
        super(message, data, tags);
        ConsoleLog.output(message, data, tags);
    }

    // TODO: complete tests!
    // Not completely tested because formatting could maybe still change - once finished, update tests too!
    static output(message, data, tags) {
        const type = ConsoleLog.__getTypeFromTags(tags);
        let color = ConsoleLog.__getColorFromType(type);

        if (tags.includes("start") && tags.includes("table")) {
            console.log(_chalk2.default.blue(ConsoleLog.__outputHorizontalLine()));
        }

        if (tags.includes("sync") && tags.includes("finish")) {
            console.log(_chalk2.default.blue(ConsoleLog.__outputHorizontalLine()));
        }

        if (tags.includes("generated") && tags.includes("sql")) {
            color = "default";
        }

        console.log(_chalk2.default[color](message));

        if (tags.includes("start") && tags.includes("table")) {
            console.log(_chalk2.default.blue(ConsoleLog.__outputHorizontalLine()));
        }
    }

    static __getColorFromType(type) {
        switch (type) {
            case "error":
                return ConsoleLog.COLOR_ERROR;
            case "warning":
                return ConsoleLog.COLOR_WARNING;
            case "success":
                return ConsoleLog.COLOR_SUCCESS;
            case "info":
                return ConsoleLog.COLOR_INFO;
            default:
                return ConsoleLog.COLOR_DEFAULT;
        }
    }

    static __getTypeFromTags(tags) {
        switch (true) {
            case tags.includes("error"):
                return "error";
            case tags.includes("warning"):
                return "warning";
            case tags.includes("success"):
                return "success";
            case tags.includes("info"):
                return "info";
            default:
                return null;
        }
    }

    static __outputHorizontalLine() {
        let output = "";
        for (let i = 0; i < 60; i++) {
            output += "\u2500";
        }
        return output;
    }
}

ConsoleLog.COLOR_ERROR = "red";
ConsoleLog.COLOR_WARNING = "yellow";
ConsoleLog.COLOR_SUCCESS = "green";
ConsoleLog.COLOR_INFO = "blue";
ConsoleLog.COLOR_DEFAULT = "default";

exports.default = ConsoleLog;
//# sourceMappingURL=consoleLog.js.map
