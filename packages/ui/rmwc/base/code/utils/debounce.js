/* eslint-disable */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = function (func, wait) {
    var timeout;
    return function () {
        // @ts-ignore
        var context = this,
            args = arguments;
        var later = function () {
            timeout = null;
            func.apply(context, args);
        };
        timeout !== null && clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
