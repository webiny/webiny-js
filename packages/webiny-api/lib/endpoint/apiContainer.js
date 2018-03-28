"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _values = require("babel-runtime/core-js/object/values");

var _values2 = _interopRequireDefault(_values);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _apiMethod = require("./apiMethod");

var _apiMethod2 = _interopRequireDefault(_apiMethod);

var _endpoint = require("./../endpoint");

var _matchedApiMethod = require("./matchedApiMethod");

var _matchedApiMethod2 = _interopRequireDefault(_matchedApiMethod);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ApiContainer {
    constructor(context) {
        this.apiMethods = {};
        this.context = context;
    }

    api(name, httpMethod, pattern, callable) {
        if (!pattern.startsWith("/")) {
            pattern = "/" + pattern;
        }

        let apiInstance;
        if (callable) {
            if (_lodash2.default.has(this.apiMethods, name)) {
                apiInstance = this.apiMethods[name];
            } else {
                apiInstance = new _apiMethod2.default(name, httpMethod, pattern, this.context);
            }

            apiInstance.addCallback(callable);
            this.apiMethods[name] = apiInstance;
        } else {
            apiInstance = this.apiMethods[name] || null;
        }

        return apiInstance;
    }

    extend(name, fn) {
        const apiMethod = this.apiMethods[name];
        if (!apiMethod) {
            throw new Error(`Method ${name} doesn't exist!`);
        }
        apiMethod.addCallback(fn);
        return apiMethod;
    }

    get(name, pattern, fn) {
        return this.api(name, "get", pattern, fn);
    }

    post(name, pattern, fn) {
        return this.api(name, "post", pattern, fn);
    }

    patch(name, pattern, fn) {
        return this.api(name, "patch", pattern, fn);
    }

    delete(name, pattern, fn) {
        return this.api(name, "delete", pattern, fn);
    }

    removeMethod(name) {
        delete this.apiMethods[name];
    }

    getMethods() {
        return this.apiMethods;
    }

    getMethod(name) {
        return this.apiMethods[name];
    }

    matchMethod(httpMethod, url) {
        httpMethod = httpMethod.toLowerCase();
        let matched = null;

        const methods = [];
        (0, _values2.default)(this.apiMethods).map(m => {
            const method = m;
            if (method.httpMethod === httpMethod) {
                methods.push(method);
            }
        });

        const length = arr => arr.filter(v => !_lodash2.default.isEmpty(v)).length;

        methods.sort((methodA, methodB) => {
            // 1 means 'a' goes after 'b'
            const a = methodA.getPattern();
            const b = methodB.getPattern();

            if (a.startsWith("/:") && !b.startsWith("/:")) {
                return 1;
            }

            const al = length(a.split("/"));
            const bl = length(b.split("/"));
            let position = al !== bl ? (al > bl ? -1 : 1) : 0;

            if (position !== 0) {
                return position;
            }

            // Compare number of variables
            const av = length(a.match(/:|\*/g) || []);
            const bv = length(b.match(/:|\*/g) || []);
            return av !== bv ? (av > bv ? 1 : -1) : 0;
        });

        _lodash2.default.each(methods, apiMethod => {
            if (!apiMethod.getRegex().test(url)) {
                return;
            }

            const paramValues = {};
            if (apiMethod.paramNames) {
                const matchedParams = url.match(apiMethod.getRegex());
                if (matchedParams) {
                    matchedParams.shift();
                    matchedParams.forEach((value, index) => {
                        paramValues[apiMethod.paramNames[index]] = value;
                    });
                }
            }

            matched = new _matchedApiMethod2.default(apiMethod, paramValues);
            return false;
        });

        return matched;
    }
}

exports.default = ApiContainer;
//# sourceMappingURL=apiContainer.js.map
