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

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _View = require("./View");

var _View2 = _interopRequireDefault(_View);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Switcher = (function(_React$Component) {
    (0, _inherits3.default)(Switcher, _React$Component);

    function Switcher(props) {
        (0, _classCallCheck3.default)(this, Switcher);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Switcher.__proto__ || Object.getPrototypeOf(Switcher)).call(this, props)
        );

        _this.views = {};
        _this.defaultView = null;
        _this.viewProps = {
            container: _this,
            attachView: function attachView(view) {
                _this.views[view.props.view] = view;
            },
            detachView: function detachView(view) {
                delete _this.views[view.props.view];
            }
        };

        ["showView", "renderView"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(Switcher, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.defaultView) {
                    this.views[this.defaultView].show();
                }
            }
        },
        {
            key: "showView",
            value: function showView(name) {
                var _this2 = this;

                return function() {
                    var params =
                        arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                    if (params !== undefined && (0, _isFunction3.default)(params.persist)) {
                        params = {};
                    }

                    var nextView = _this2.views[name];
                    if (!nextView) {
                        console.warn(
                            "Warning: view '" + name + "' was not found in ViewContainer!"
                        );
                        return Promise.resolve();
                    }

                    if (!nextView.props.modal) {
                        // Hide all currently shown views
                        (0, _each3.default)(_this2.views, function(view) {
                            if (view.isShown()) {
                                view.hide();
                            }
                        });
                    }
                    return Promise.resolve(nextView.show(params));
                };
            }
        },
        {
            key: "renderView",
            value: function renderView(view) {
                if ((0, _webinyApp.isElementOfType)(view, _View2.default)) {
                    if (view.props.defaultView) {
                        this.defaultView = view.props.view;
                    }
                    return _react2.default.cloneElement(
                        view,
                        (0, _assign3.default)({}, this.viewProps, { key: view.props.view })
                    );
                }
                return null;
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                return _react2.default.createElement(
                    "webiny-view-switcher",
                    null,
                    _react2.default.Children.map(this.props.children, this.renderView)
                );
            }
        }
    ]);
    return Switcher;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Switcher);
//# sourceMappingURL=Switcher.js.map
