"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _authentication = require("./middleware/authentication");

Object.defineProperty(exports, "authenticationMiddleware", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_authentication).default;
    }
});

var _app = require("./app");

Object.defineProperty(exports, "app", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_app).default;
    }
});

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}
//# sourceMappingURL=index.js.map
