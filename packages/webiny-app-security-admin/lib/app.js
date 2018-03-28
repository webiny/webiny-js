"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _authentication = require("./services/authentication");

var _authentication2 = _interopRequireDefault(_authentication);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return function(_ref, next) {
        var app = _ref.app;

        app.services.add("authentication", function() {
            return new _authentication2.default(config.authentication || {});
        });

        next();
    };
};
//# sourceMappingURL=app.js.map
