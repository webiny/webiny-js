/* eslint-disable */
"use strict";
var __extends =
    (this && this.__extends) ||
    (function () {
        var extendStatics = function (d, b) {
            extendStatics =
                Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array &&
                    function (d, b) {
                        d.__proto__ = b;
                    }) ||
                function (d, b) {
                    for (var p in b) {
                        if (b.hasOwnProperty(p)) {
                            d[p] = b[p];
                        }
                    }
                };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() {
                this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
        };
    })();
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
var __read =
    (this && this.__read) ||
    function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) {
            return o;
        }
        var i = m.call(o),
            r,
            ar = [],
            e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) {
                ar.push(r.value);
            }
        } catch (error) {
            e = { error: error };
        } finally {
            try {
                if (r && !r.done && (m = i["return"])) {
                    m.call(i);
                }
            } finally {
                if (e) {
                    throw e.error;
                }
            }
        }
        return ar;
    };
var __spread =
    (this && this.__spread) ||
    function () {
        for (var ar = [], i = 0; i < arguments.length; i++) {
            ar = ar.concat(__read(arguments[i]));
        }
        return ar;
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
var events_map_1 = require("./utils/events-map");
var debounce_1 = require("./utils/debounce");
var strings_1 = require("./utils/strings");
var reactPropFromEventName = function (evtName) {
    return events_map_1.eventsMap[evtName] || evtName;
};
var FoundationElement = /** @class */ (function () {
    function FoundationElement(onChange) {
        this._classes = new Set();
        this._events = {};
        this._style = {};
        this._props = {};
        this._ref = null;
        this._onChange = null;
        this._onChange = onChange;
        this.onChange = this.onChange.bind(this);
        this.addClass = this.addClass.bind(this);
        this.removeClass = this.removeClass.bind(this);
        this.hasClass = this.hasClass.bind(this);
        this.setProp = this.setProp.bind(this);
        this.getProp = this.getProp.bind(this);
        this.removeProp = this.removeProp.bind(this);
        this.setStyle = this.setStyle.bind(this);
        this.addEventListener = this.addEventListener.bind(this);
        this.removeEventListener = this.removeEventListener.bind(this);
        this.setRef = this.setRef.bind(this);
    }
    FoundationElement.prototype.onChange = function () {
        this._onChange && this._onChange();
    };
    FoundationElement.prototype.destroy = function () {
        this._onChange = null;
        this._ref = null;
        this._events = {};
        this._style = {};
        this._props = {};
        this._classes = new Set();
    };
    /**************************************************
     * Classes
     **************************************************/
    FoundationElement.prototype.addClass = function (className) {
        if (!this._classes.has(className)) {
            this._classes.add(className);
            this.onChange();
        }
    };
    FoundationElement.prototype.removeClass = function (className) {
        if (this._classes.has(className)) {
            this._classes.delete(className);
            this.onChange();
        }
    };
    FoundationElement.prototype.hasClass = function (className) {
        return this._classes.has(className);
    };
    /**************************************************
     * Props
     **************************************************/
    FoundationElement.prototype.setProp = function (propName, value) {
        if (this._props[propName] !== value) {
            this._props[propName] = value;
            this.onChange();
        }
    };
    FoundationElement.prototype.getProp = function (propName) {
        return this._props[propName];
    };
    FoundationElement.prototype.removeProp = function (propName) {
        if (this._props[propName] !== undefined) {
            delete this._props[propName];
            this.onChange();
        }
    };
    FoundationElement.prototype.props = function (propsToMerge) {
        var _this = this;
        var _a = propsToMerge.className,
            className = _a === void 0 ? "" : _a,
            _b = propsToMerge.style,
            style = _b === void 0 ? {} : _b;
        // handle merging events
        // the foundation should be able to pass something onClick as well as a user
        // This wraps them in a function that calls both
        var mergedEvents = Object.entries(propsToMerge).reduce(function (acc, _a) {
            var _b = __read(_a, 2),
                key = _b[0],
                possibleCallback = _b[1];
            var existingCallback = _this._events[key];
            if (typeof possibleCallback === "function" && typeof existingCallback === "function") {
                var wrappedCallback = function (evt) {
                    existingCallback(evt);
                    return possibleCallback(evt);
                };
                acc[key] = wrappedCallback;
            }
            return acc;
        }, __assign({}, this._events));
        // handle className
        var mergedClasses = classnames_1.default(className, __spread(this._classes));
        // handle styles
        var mergedStyles = __assign({}, this._style, style);
        return __assign({}, propsToMerge, this._props, mergedEvents, {
            style: mergedStyles,
            className: mergedClasses
        });
    };
    /**************************************************
     * Styles
     **************************************************/
    FoundationElement.prototype.setStyle = function (propertyName, value) {
        propertyName = propertyName.startsWith("--")
            ? propertyName
            : strings_1.toCamel(propertyName);
        if (this._style[propertyName] !== value) {
            this._style[propertyName] = value;
            this.onChange();
        }
    };
    /**************************************************
     * Events
     **************************************************/
    FoundationElement.prototype.addEventListener = function (evtName, callback) {
        var propName = reactPropFromEventName(evtName);
        if (this._events[propName] !== callback) {
            this._events[propName] = callback;
            this.onChange();
        }
    };
    FoundationElement.prototype.removeEventListener = function (evtName, callback) {
        var propName = reactPropFromEventName(evtName);
        if (this._events[propName]) {
            delete this._events[propName];
            this.onChange();
        }
    };
    /**************************************************
     * Refs
     **************************************************/
    FoundationElement.prototype.setRef = function (el) {
        if (el) {
            this._ref = el;
        }
    };
    Object.defineProperty(FoundationElement.prototype, "ref", {
        get: function () {
            return this._ref;
        },
        enumerable: true,
        configurable: true
    });
    return FoundationElement;
})();
exports.FoundationElement = FoundationElement;
var FoundationComponent = /** @class */ (function (_super) {
    __extends(FoundationComponent, _super);
    function FoundationComponent(props) {
        var _this = _super.call(this, props) || this;
        _this.elements = {};
        //@ts-ignore
        if (_this.constructor.shouldDebounce) {
            _this.update = debounce_1.debounce(_this.update.bind(_this), 0);
        } else {
            _this.update = _this.update.bind(_this);
        }
        return _this;
    }
    FoundationComponent.prototype.componentDidMount = function () {
        this.foundation = this.getDefaultFoundation();
        this.foundation.init();
        this.sync(this.props, {});
    };
    FoundationComponent.prototype.componentDidUpdate = function (prevProps) {
        this.sync(this.props, prevProps);
    };
    FoundationComponent.prototype.componentWillUnmount = function () {
        this.foundation && this.foundation.destroy();
        // @ts-ignore
        this.foundation = undefined;
        Object.values(this.elements).forEach(function (el) {
            return el.destroy();
        });
    };
    FoundationComponent.prototype.createElement = function (elementName) {
        var el = new FoundationElement(this.update);
        this.elements[elementName] = el;
        return el;
    };
    FoundationComponent.prototype.update = function () {
        this.foundation && this.setState({});
    };
    FoundationComponent.prototype.sync = function (props, prevProps) {};
    FoundationComponent.prototype.syncProp = function (prop, prevProp, callback) {
        if (
            (prop !== undefined || (prevProp !== undefined && prop === undefined)) &&
            prop !== prevProp
        ) {
            callback();
        }
    };
    FoundationComponent.prototype.getDefaultFoundation = function () {
        return {
            init: function () {},
            destroy: function () {}
        };
    };
    /**
     * Fires a cross-browser-compatible custom event from the component root of the given type,
     */
    FoundationComponent.prototype.emit = function (evtType, evtData, shouldBubble) {
        if (shouldBubble === void 0) {
            shouldBubble = false;
        }
        var evt;
        evt = new CustomEvent(evtType, {
            detail: evtData,
            bubbles: shouldBubble
        });
        // bugfix for events coming from form elements
        // and also fits with reacts form pattern better...
        // This should always otherwise be null since there is no target
        // for Custom Events
        Object.defineProperty(evt, "target", {
            value: evtData,
            writable: false
        });
        Object.defineProperty(evt, "currentTarget", {
            value: evtData,
            writable: false
        });
        // Custom handling for React
        var propName = evtType;
        // check to see if the foundation still exists. If not, we are
        // probably unmounted or destroyed and dont want to call any more handlers
        // This happens when MDC broadcasts certain events on timers
        if (this.foundation) {
            //@ts-ignore
            this.props[propName] && this.props[propName](evt);
        }
        return evt;
    };
    FoundationComponent.shouldDebounce = false;
    return FoundationComponent;
})(React.Component);
exports.FoundationComponent = FoundationComponent;
