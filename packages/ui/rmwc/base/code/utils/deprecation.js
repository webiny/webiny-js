"use strict";
var __assign =
    (this && this.__assign) ||
    function () {
        __assign =
            Object.assign ||
            function (t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) {
                        if (Object.prototype.hasOwnProperty.call(s, p)) {
                            t[p] = s[p];
                        }
                    }
                }
                return t;
            };
        return __assign.apply(this, arguments);
    };
Object.defineProperty(exports, "__esModule", { value: true });
exports.deprecationWarning = function (message) {
    if (process && process.env && process.env.NODE_ENV !== "production") {
        console.warn("RMWC Deprecation Warning: " + message);
    }
};
exports.handleDeprecations = function (props, deprecate, displayName) {
    props = __assign({}, props);
    for (var oldPropName in deprecate) {
        var newProp = deprecate[oldPropName];
        var newPropName = void 0;
        var transformProp = function (value) {
            return value;
        };
        if (Array.isArray(newProp)) {
            newPropName = newProp[0];
            transformProp = newProp[1];
        } else {
            newPropName = newProp;
        }
        if (props[oldPropName] !== undefined) {
            if (newPropName === "") {
                /* istanbul ignore next */
                exports.deprecationWarning(
                    (displayName || "") +
                        " component prop '" +
                        oldPropName +
                        "' has been removed from and is no longer a valid prop."
                );
            } else {
                props[newPropName] = transformProp(props[oldPropName]);
                var propTransformMessage = "";
                if (props[newPropName] !== props[oldPropName]) {
                    propTransformMessage =
                        " The old value has also been converted from '" +
                        props[oldPropName] +
                        "' to '" +
                        props[newPropName] +
                        "'";
                }
                /* istanbul ignore next */
                exports.deprecationWarning(
                    (displayName || "") +
                        " component prop '" +
                        oldPropName +
                        "' has been replaced with '" +
                        newPropName +
                        "'. " +
                        propTransformMessage
                );
            }
            delete props[oldPropName];
        }
    }
    return props;
};
