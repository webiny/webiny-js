"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _apiMethod = require("./apiMethod");

var _apiMethod2 = _interopRequireDefault(_apiMethod);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class MatchedApiMethod {
    constructor(apiMethod, params) {
        this.apiMethod = apiMethod;
        this.params = params;
    }

    getApiMethod() {
        return this.apiMethod;
    }

    getParams() {
        return this.params;
    }
}
exports.default = MatchedApiMethod;
//# sourceMappingURL=matchedApiMethod.js.map
