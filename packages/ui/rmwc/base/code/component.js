"use strict";
var __assign =
    (this && this.__assign) ||
    function () {
        __assign =
            Object.assign ||
            function (t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
            };
        return __assign.apply(this, arguments);
    };
var __rest =
    (this && this.__rest) ||
    function (s, e) {
        var t = {};
        for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };
var __read =
    (this && this.__read) ||
    function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o),
            r,
            ar = [],
            e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
            e = { error: error };
        } finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            } finally {
                if (e) throw e.error;
            }
        }
        return ar;
    };
var __spread =
    (this && this.__spread) ||
    function () {
        for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
        return ar;
    };
var __importStar =
    (this && this.__importStar) ||
    function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null)
            for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
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
var with_theme_1 = require("./with-theme");
var deprecation_1 = require("./utils/deprecation");
// ALL OF THESE FUNCTIONS MUTATE THE COPY OF PROPS
// this is intentional and done for speed and memory
var handleClassNames = function (props, classNames, className, theme) {
    var finalClassNames = classnames_1.default.apply(
        void 0,
        __spread(
            [className],
            !!theme ? with_theme_1.parseThemeOptions(theme) : [],
            typeof classNames === "function" ? classNames(props) : classNames
        )
    );
    props.className = finalClassNames;
};
var handleTag = function (props, defaultTag, tag) {
    // Handle the case where we are extending a component but passing
    // a string as a tag. For instance, extending an Icon but rendering a span
    if (typeof defaultTag !== "string") {
        props.tag = tag;
        return defaultTag;
    }
    return tag || defaultTag;
};
var handleConsumeProps = function (props, consumeProps) {
    consumeProps.forEach(function (p) {
        delete props[p];
    });
};
exports.componentFactory = function (_a) {
    var displayName = _a.displayName,
        _b = _a.classNames,
        classNames = _b === void 0 ? [] : _b,
        _c = _a.tag,
        defaultTag = _c === void 0 ? "div" : _c,
        deprecate = _a.deprecate,
        defaultProps = _a.defaultProps,
        _d = _a.consumeProps,
        consumeProps = _d === void 0 ? [] : _d,
        render = _a.render;
    var Component = React.forwardRef(function (props, ref) {
        var className = props.className,
            theme = props.theme,
            tag = props.tag,
            rest = __rest(props, ["className", "theme", "tag"]);
        var newProps = rest;
        handleClassNames(newProps, classNames, className, theme);
        var Tag = handleTag(newProps, defaultTag, tag);
        if (deprecate) {
            newProps = deprecation_1.handleDeprecations(newProps, deprecate, displayName);
        }
        handleConsumeProps(newProps, consumeProps);
        var finalProps = newProps;
        // @ts-ignore
        return render
            ? render(finalProps, ref, Tag)
            : React.createElement(Tag, __assign({}, finalProps, { ref: ref }));
    });
    Component.displayName = displayName;
    Component.defaultProps = defaultProps;
    return Component;
};
