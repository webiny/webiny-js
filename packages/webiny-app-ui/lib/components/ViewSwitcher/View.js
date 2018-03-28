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

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var View = (function(_React$Component) {
    (0, _inherits3.default)(View, _React$Component);

    function View(props) {
        (0, _classCallCheck3.default)(this, View);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (View.__proto__ || Object.getPrototypeOf(View)).call(this, props)
        );

        _this.state = {
            show: false,
            data: null
        };

        _this.show = _this.show.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(View, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                if (this.props.attachView) {
                    this.props.attachView(this);
                }
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                if (this.props.detachView) {
                    this.props.detachView(this);
                }
            }
        },
        {
            key: "isShown",
            value: function isShown() {
                return this.state.show;
            }
        },
        {
            key: "show",
            value: function show(data) {
                var _this2 = this;

                return new Promise(function(resolve) {
                    _this2.showResolve = resolve;
                    _this2.setState({ show: true, data: data });
                });
            }
        },
        {
            key: "hide",
            value: function hide() {
                if (this.props.modal && this.state.show) {
                    return this.view.hide();
                }

                if (this.state.show) {
                    this.setState({ show: false, data: null });
                }

                return Promise.resolve(true);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (this.state.show) {
                    var params = {
                        showView: this.props.container.showView,
                        data: this.state.data
                    };

                    var view = this.props.children(params);
                    if (!view) {
                        return null;
                    }

                    var props = {
                        ref: function ref(_ref) {
                            return (_this3.view = _ref);
                        }
                    };
                    if (this.props.modal) {
                        var dialogName = view.props.name;
                        // We need access to the actual mounted instance of component and not the proxy ComponentWrapper
                        props.onReady = function() {
                            _webinyApp.app.services
                                .get("modal")
                                .show(dialogName)
                                .then(_this3.showResolve || _noop3.default);
                        };
                        props.onHidden = function() {
                            _this3.setState({ show: false, data: null });
                        };
                    }
                    return _react2.default.cloneElement(view, props);
                }
                return null;
            }
        }
    ]);
    return View;
})(_react2.default.Component);

View.defaultProps = {
    view: null,
    defaultView: false,
    modal: false
};

exports.default = (0, _webinyApp.createComponent)(View);
//# sourceMappingURL=View.js.map
