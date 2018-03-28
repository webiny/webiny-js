"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.app = exports.Menu = undefined;

var _Menu = require("./components/Menu");

Object.defineProperty(exports, "Menu", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_Menu).default;
    }
});

var _app = require("./app");

Object.defineProperty(exports, "app", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_app).default;
    }
});

require("./assets/styles.scss");

require("./assets/images/public/bg-login.png");

require("./assets/images/public/preloader_2.png");

require("./assets/images/public/favicon.ico");

require("./assets/images/public/logo_orange.png");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}
//# sourceMappingURL=index.js.map
