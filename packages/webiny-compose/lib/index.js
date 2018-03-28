"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

exports.default = function(functions = []) {
    return function(params) {
        if (!functions.length) {
            return _promise2.default.resolve();
        }

        // Create a clone of function chain to prevent modifying the original array with `shift()`
        const chain = [...functions];
        return new _promise2.default((parentResolve, parentReject) => {
            const next = (() => {
                var _ref = (0, _asyncToGenerator3.default)(function*() {
                    const fn = chain.shift();
                    if (!fn) {
                        return _promise2.default.resolve();
                    }
                    return new _promise2.default(
                        (() => {
                            var _ref2 = (0, _asyncToGenerator3.default)(function*(resolve, reject) {
                                try {
                                    yield fn(params, resolve, parentResolve);
                                } catch (e) {
                                    reject(e);
                                }
                            });

                            return function(_x, _x2) {
                                return _ref2.apply(this, arguments);
                            };
                        })()
                    )
                        .then(function() {
                            return next();
                        })
                        .then(function() {
                            parentResolve();
                        })
                        .catch(function(e) {
                            parentReject(e);
                        });
                });

                return function next() {
                    return _ref.apply(this, arguments);
                };
            })();

            return next();
        });
    };
};

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}
//# sourceMappingURL=index.js.map
