"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _apiResponse = require("./apiResponse");

var _apiResponse2 = _interopRequireDefault(_apiResponse);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * ApiErrorResponse class is used to return error responses from your endpoints
 * @param {mixed} data
 * @param {string} message
 * @param {string} errorCode
 * @param {string} statusCode
 */
class ApiErrorResponse extends _apiResponse2.default {
    constructor(
        data = null,
        message = "",
        errorCode = "",
        statusCode = ApiErrorResponse.ERROR_STATUS_CODE
    ) {
        super(data, message, statusCode);
        this.errorCode = errorCode;
    }

    formatResponse() {
        const data = super.formatResponse();
        data.code = this.errorCode;
        if (_lodash2.default.isEmpty(data.data)) {
            delete data.data;
        }

        return data;
    }
}

ApiErrorResponse.ERROR_STATUS_CODE = 404;

exports.default = ApiErrorResponse;
//# sourceMappingURL=apiErrorResponse.js.map
