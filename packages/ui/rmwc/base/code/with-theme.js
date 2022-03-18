/* eslint-disable */
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
var __rest =
    (this && this.__rest) ||
    function (s, e) {
        var t = {};
        for (var p in s) {
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) {
                t[p] = s[p];
            }
        }
        if (s != null && typeof Object.getOwnPropertySymbols === "function") {
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) {
                    t[p[i]] = s[p[i]];
                }
            }
        }
        return t;
    };
var __importStar =
    (this && this.__importStar) ||
    function (mod) {
        if (mod && mod.__esModule) {
            return mod;
        }
        var result = {};
        if (mod != null) {
            for (var k in mod) {
                if (Object.hasOwnProperty.call(mod, k)) {
                    result[k] = mod[k];
                }
            }
        }
        result["default"] = mod;
        return result;
    };
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var classnames_1 = __importDefault(require("classnames"));
var strings_1 = require("./utils/strings");
var deprecation_1 = require("./utils/deprecation");
/**
 * Actually parses the theme options
 */
exports.parseThemeOptions = function (theme) {
    if (typeof theme === "string" && theme.includes(" ")) {
        deprecation_1.deprecationWarning(
            "Theme no longer accepts a string of theme names with spaces. Please pass them as an array instead."
        );
    }
    var themeItems = Array.isArray(theme) ? theme : theme.split(" ");
    return themeItems.map(function (v) {
        if (v.includes("-")) {
            deprecation_1.deprecationWarning(
                "Theme properties need to be passed as camelCase. Please convert " +
                    v +
                    " to " +
                    v.replace(/-([a-z])/g, function (m, w) {
                        return w.toUpperCase();
                    })
            );
        }
        return "mdc-theme--" + strings_1.toDashCase(v);
    });
};
/**
 * HOC that adds themeability to any component
 */
exports.withTheme = function (Component) {
    var HOC = function (_a) {
        var theme = _a.theme,
            className = _a.className,
            rest = __rest(_a, ["theme", "className"]);
        if (theme) {
            var classes = classnames_1.default(className, exports.parseThemeOptions(theme));
            return React.createElement(Component, __assign({ className: classes }, rest));
        }
        return React.createElement(Component, __assign({ className: className }, rest));
    };
    HOC.displayName = "withTheme";
    return HOC;
};
