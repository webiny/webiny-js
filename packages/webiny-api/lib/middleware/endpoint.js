"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyCompose = require("webiny-compose");

var _webinyCompose2 = _interopRequireDefault(_webinyCompose);

var _semver = require("semver");

var _semver2 = _interopRequireDefault(_semver);

var _index = require("./../index");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = (options = {}) => {
    // Endpoint hooks in form of a middleware
    const beforeApiMethodMiddleware = (0, _webinyCompose2.default)(
        _lodash2.default.get(options, "beforeApiMethod", [])
    );
    const afterApiMethodMiddleware = (0, _webinyCompose2.default)(
        _lodash2.default.get(options, "afterApiMethod", [])
    );

    return (() => {
        var _ref = (0, _asyncToGenerator3.default)(function*(params, next) {
            const { req, res, versioning } = params;
            const log = (0, _debug2.default)("api:endpoint");
            log(`Trying to match an endpoint: %o`, req.method + " " + req.path);
            const reqVersion = versioning(req);

            const versionPrefix = reqVersion !== "latest" ? "/v" + reqVersion : "";
            const reqUrl = req.path
                .replace(versionPrefix, "")
                .split("?")
                .shift();

            const urls = (0, _keys2.default)(_index.app.endpoints);

            for (let i = 0; i < urls.length; i++) {
                const baseUrl = urls[i];
                const definition = _index.app.endpoints[baseUrl];

                if (!reqUrl.startsWith(baseUrl)) {
                    continue;
                }

                const url = reqUrl.replace(baseUrl, "") || "/";
                log(`Routing endpoint %o, with URL: %o`, definition.classId, url);

                let maxVersion = definition.latest;
                if (reqVersion !== "latest") {
                    maxVersion = _semver2.default.maxSatisfying(
                        (0, _keys2.default)(definition.versions),
                        reqVersion
                    );
                }

                if (
                    reqVersion !== "latest" &&
                    !_semver2.default.satisfies(maxVersion, reqVersion)
                ) {
                    log(`Requested API version could not be satisfied!`);
                    break;
                }

                const instance = new definition.versions[maxVersion]();
                const matchedMethod = instance.getApi().matchMethod(req.method, url);
                if (!matchedMethod) {
                    break;
                }

                log(
                    "Matched %o with pattern %o",
                    matchedMethod.getApiMethod().getName(),
                    matchedMethod.getApiMethod().getPattern()
                );

                try {
                    yield beforeApiMethodMiddleware({ req, res, matchedApiMethod: matchedMethod });
                } catch (e) {
                    params.response = new _index.ApiErrorResponse(
                        {},
                        e.message,
                        e.type || "WBY_MATCHED_METHOD",
                        401
                    );
                    break;
                }

                const methodParams = matchedMethod.getParams();
                const response = yield matchedMethod
                    .getApiMethod()
                    .exec(req, res, methodParams, instance);

                try {
                    yield afterApiMethodMiddleware({ matchedApiMethod: matchedMethod, response });
                } catch (e) {
                    params.response = new _index.ApiErrorResponse(
                        {},
                        e.message,
                        e.type || "WBY_MATCHED_METHOD",
                        401
                    );
                    break;
                }

                // Assign response to the params object so other middleware functions can access and modify it.
                params.response = response;
                log(`Successfully fetched response!`);
            }
            next();
        });

        return function(_x, _x2) {
            return _ref.apply(this, arguments);
        };
    })();
};
//# sourceMappingURL=endpoint.js.map
