/* eslint-disable */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCamel = function (str) {
    return str.replace(/(-[a-z])/g, function ($1) {
        return $1.toUpperCase().replace("-", "");
    });
};
exports.toDashCase = function (str) {
    return str.replace(/([A-Z])/g, function ($1) {
        return "-" + $1.toLowerCase();
    });
};
