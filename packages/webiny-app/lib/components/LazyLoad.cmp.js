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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _react = require("react");

var React = _interopRequireWildcard(_react);

var _2 = require("./../");

function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
            }
        }
        newObj.default = obj;
        return newObj;
    }
}

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var LazyLoad = (function(_React$Component) {
    (0, _inherits3.default)(LazyLoad, _React$Component);

    function LazyLoad(props) {
        (0, _classCallCheck3.default)(this, LazyLoad);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (LazyLoad.__proto__ || Object.getPrototypeOf(LazyLoad)).call(this, props)
        );

        _this.mounted = false;

        _this.state = {
            loaded: false,
            modules: null
        };
        return _this;
    }

    (0, _createClass3.default)(LazyLoad, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                this.mounted = true;
                var _props = this.props,
                    modules = _props.modules,
                    options = _props.options,
                    onLoad = _props.onLoad;

                _2.app.modules.load(modules, options).then(function(modules) {
                    // Finish loading and render content
                    if (_this2.mounted) {
                        _this2.setState({ loaded: true, modules: modules });
                        onLoad(modules);
                    }
                });
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.mounted = false;
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (this.state.loaded) {
                    try {
                        return this.props.children(this.state.modules);
                    } catch (e) {
                        console.error(e);
                    }
                }
                return null;
            }
        }
    ]);
    return LazyLoad;
})(React.Component);

LazyLoad.defaultProps = {
    modules: [],
    options: {},
    onLoad: _noop3.default
};

exports.default = LazyLoad;
//# sourceMappingURL=LazyLoad.cmp.js.map
