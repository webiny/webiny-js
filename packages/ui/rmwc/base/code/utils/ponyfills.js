"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closest = function (element, selector) {
    if (element instanceof Element) {
        /* istanbul ignore else  */
        if (element && element.closest) {
            return element.closest(selector);
        } else {
            var el = element;
            while (el) {
                if (exports.matches(el, selector)) {
                    return el;
                }
                el = el.parentElement;
            }
        }
    }
    return null;
};
exports.matches = function (element, selector) {
    /* istanbul ignore next  */
    var nativeMatches =
        element.matches ||
        element.webkitMatchesSelector ||
        // @ts-ignore
        element.msMatchesSelector;
    return nativeMatches.call(element, selector);
};
