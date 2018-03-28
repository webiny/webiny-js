"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _sync = require("./sync");

Object.defineProperty(exports, "Sync", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_sync).default;
    }
});

var _log = require("./log");

Object.defineProperty(exports, "Log", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_log).default;
    }
});

var _consoleLog = require("./consoleLog");

Object.defineProperty(exports, "ConsoleLog", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_consoleLog).default;
    }
});

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}
//# sourceMappingURL=index.js.map
