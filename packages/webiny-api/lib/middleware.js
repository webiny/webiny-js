"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

var _index = require("./index");

var _clsHooked = require("cls-hooked");

var _clsHooked2 = _interopRequireDefault(_clsHooked);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function initApp(config, namespace) {
    _index.app.setConfig(config);
    _index.app.init(namespace);
}

// TODO: create Flow object for config

exports.default = config => {
    const log = (0, _debug2.default)("api:middleware");
    const namespace = _clsHooked2.default.createNamespace(Date.now().toString());
    initApp(config, namespace);

    // Route request
    return (() => {
        var _ref = (0, _asyncToGenerator3.default)(function*(req, res, next) {
            log("Received new API request");
            namespace.run(
                (0, _asyncToGenerator3.default)(function*() {
                    return (0, _asyncToGenerator3.default)(function*() {
                        namespace.set("req", req);
                        const response = yield _index.app.handleRequest(req, res);

                        if (res.finished) {
                            log("Request was finished before reaching the end of the cycle!");
                            return;
                        }

                        if (!_lodash2.default.isEmpty(response)) {
                            log("Finished processing request");

                            if (response instanceof _index.ApiResponse) {
                                response.send(res);
                            }
                        }

                        next();
                    })();
                })
            );
        });

        return function(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
        };
    })();
};
//# sourceMappingURL=middleware.js.map
