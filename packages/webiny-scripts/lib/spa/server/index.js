"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function*(config) {
        const { default: server } = yield process.env.NODE_ENV === "production"
            ? _promise2.default.resolve().then(() => require("./production"))
            : _promise2.default.resolve().then(() => require("./development"));
        return server(config);
    });

    return function(_x) {
        return _ref.apply(this, arguments);
    };
})();
//# sourceMappingURL=index.js.map
