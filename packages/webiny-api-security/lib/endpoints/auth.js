"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyApi = require("webiny-api");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Auth extends _webinyApi.Endpoint {
    init(api) {
        const notAuthenticated = new _webinyApi.ApiErrorResponse(
            {},
            "You are not authenticated!",
            "WBY_NOT_AUTHENTICATED",
            401
        );

        /**
         * Identity profile
         */
        api
            .get(
                "Auth.Me",
                "/me",
                (() => {
                    var _ref = (0, _asyncToGenerator3.default)(function*({ req }) {
                        if (!req.identity) {
                            return notAuthenticated;
                        }
                        return new _webinyApi.ApiResponse(
                            yield req.identity.toJSON(req.query._fields)
                        );
                    });

                    return function(_x) {
                        return _ref.apply(this, arguments);
                    };
                })()
            )
            .setPublic();

        api
            .patch(
                "Auth.Me.Update",
                "/me",
                (() => {
                    var _ref2 = (0, _asyncToGenerator3.default)(function*({
                        req: { identity, query, body }
                    }) {
                        if (!identity) {
                            return notAuthenticated;
                        }

                        yield identity.populate(body).save();

                        return new _webinyApi.ApiResponse(yield identity.toJSON(query._fields));
                    });

                    return function(_x2) {
                        return _ref2.apply(this, arguments);
                    };
                })()
            )
            .setPublic();
    }
}

Auth.classId = "Security.Authentication";
Auth.version = "1.0.0";

exports.default = Auth;
//# sourceMappingURL=auth.js.map
