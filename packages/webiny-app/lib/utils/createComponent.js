"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _isPlainObject2 = require("lodash/isPlainObject");

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _hasIn2 = require("lodash/hasIn");

var _hasIn3 = _interopRequireDefault(_hasIn2);

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _hoistNonReactStatics = require("hoist-non-react-statics");

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

var _LazyLoad = require("./../components/LazyLoad.cmp");

var _LazyLoad2 = _interopRequireDefault(_LazyLoad);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var hocCompose = function hocCompose(components) {
    return function(props) {
        return components.reduce(function(Res, Cmp) {
            if (!Res) {
                return _react2.default.createElement(Cmp, props);
            }

            return _react2.default.createElement(Cmp, props, Res);
        }, null);
    };
};

/**
 * This function creates a wrapper class around given component to allow component styling and lazy loading of dependencies
 */

exports.default = function(components) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var Component = Array.isArray(components) ? components[0] : components;
    var name = Array.isArray(components) ? components[0].name : components.name;

    // Create a copy of styles to use as default styles
    var defaultStyles = Object.assign({}, options.styles);

    var createElement = hocCompose(Array.isArray(components) ? components : [components]);

    var ComponentWrapper = (function(_React$Component) {
        (0, _inherits3.default)(ComponentWrapper, _React$Component);

        function ComponentWrapper() {
            (0, _classCallCheck3.default)(this, ComponentWrapper);
            return (0, _possibleConstructorReturn3.default)(
                this,
                (ComponentWrapper.__proto__ || Object.getPrototypeOf(ComponentWrapper)).apply(
                    this,
                    arguments
                )
            );
        }

        (0, _createClass3.default)(
            ComponentWrapper,
            [
                {
                    key: "render",
                    value: function render() {
                        var _this2 = this;

                        var props = (0, _omit3.default)(this.props, ["styles"]);
                        props.ref = function(c) {
                            return (_this2.component = c);
                        };

                        props.styles = Object.assign({}, defaultStyles);

                        // If new styles are given, merge them with default styles
                        if ((0, _isPlainObject3.default)(this.props.styles)) {
                            (0, _merge3.default)(props.styles, this.props.styles);
                        }

                        // If lazy loaded modules are defined - return LazyLoad wrapper
                        var modules = options.modules || {};
                        if (Object.keys(modules).length > 0) {
                            return _react2.default.createElement(
                                _LazyLoad2.default,
                                { modules: modules, options: { props: props } },
                                function(modules) {
                                    if (options.modulesProp) {
                                        props[options.modulesProp] = modules;
                                    } else {
                                        (0, _assign3.default)(props, modules);
                                    }
                                    return createElement(props);
                                }
                            );
                        }

                        return createElement(props);
                    }
                }
            ],
            [
                {
                    key: "configure",
                    value: function configure(config) {
                        // defaultProps are merged
                        (0, _merge3.default)(
                            ComponentWrapper.defaultProps,
                            config.defaultProps || {}
                        );
                        delete config.defaultProps;

                        // modules are overwritten
                        if ((0, _hasIn3.default)(config, "options.modules")) {
                            ComponentWrapper.options.modules = config.options.modules;
                            delete config.options.modules;
                        }

                        // Merge the rest
                        (0, _merge3.default)(ComponentWrapper.options, config.options || {});

                        // Create new defaultStyles object to hold modified styles
                        defaultStyles = Object.assign({}, ComponentWrapper.options.styles);
                    }
                }
            ]
        );
        return ComponentWrapper;
    })(_react2.default.Component);

    ComponentWrapper.displayName = name + "Wrapper";
    ComponentWrapper.__originalComponent = Component;
    ComponentWrapper.options = options;
    ComponentWrapper.defaultProps = (0, _assign3.default)({}, Component.defaultProps);

    return (0, _hoistNonReactStatics2.default)(ComponentWrapper, Component);
};
//# sourceMappingURL=createComponent.js.map
