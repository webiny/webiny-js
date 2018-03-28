"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _Container = require("./Container");

var _Container2 = _interopRequireDefault(_Container);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Wizard = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(Wizard, _Webiny$Ui$Component);

    function Wizard() {
        (0, _classCallCheck3.default)(this, Wizard);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Wizard.__proto__ || Object.getPrototypeOf(Wizard)).call(this)
        );

        _this.container = null;
        return _this;
    }

    (0, _createClass3.default)(Wizard, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var Form = this.props.Form;

                return _react2.default.createElement(
                    Form,
                    (0, _extends3.default)({}, this.props.form, {
                        onSubmit: (function() {
                            var _ref = (0, _asyncToGenerator3.default)(
                                /*#__PURE__*/ _regenerator2.default.mark(function _callee(params) {
                                    var onSubmit, container;
                                    return _regenerator2.default.wrap(
                                        function _callee$(_context) {
                                            while (1) {
                                                switch ((_context.prev = _context.next)) {
                                                    case 0:
                                                        // This callback won't be implemented by developers probably, because there are other valid Wizard callbacks.
                                                        onSubmit = (0, _get3.default)(
                                                            _this2.props.form,
                                                            "onSubmit"
                                                        );

                                                        if (!(0, _isFunction3.default)(onSubmit)) {
                                                            _context.next = 4;
                                                            break;
                                                        }

                                                        _context.next = 4;
                                                        return _this2.props.form.onSubmit(params);

                                                    case 4:
                                                        // We want to handle cases where user submits the form with keyboard, onSubmit gets triggered here.
                                                        container = _this2.container.component;

                                                        if (!container.isLastStep()) {
                                                            _context.next = 7;
                                                            break;
                                                        }

                                                        return _context.abrupt(
                                                            "return",
                                                            container.finish()
                                                        );

                                                    case 7:
                                                        return _context.abrupt(
                                                            "return",
                                                            container.nextStep()
                                                        );

                                                    case 8:
                                                    case "end":
                                                        return _context.stop();
                                                }
                                            }
                                        },
                                        _callee,
                                        _this2
                                    );
                                })
                            );

                            return function(_x) {
                                return _ref.apply(this, arguments);
                            };
                        })()
                    }),
                    function(_ref2) {
                        var form = _ref2.form;
                        return _react2.default.createElement(
                            _Container2.default,
                            (0, _extends3.default)(
                                {
                                    ref: function ref(container) {
                                        return (_this2.container = container);
                                    },
                                    form: form
                                },
                                (0, _omit3.default)(_this2.props, [
                                    "Form",
                                    "form",
                                    "render",
                                    "children"
                                ])
                            ),
                            _this2.props.children
                        );
                    }
                );
            }
        }
    ]);
    return Wizard;
})(_webinyApp.Webiny.Ui.Component);

Wizard.defaultProps = {
    contentRenderer: undefined,
    actionsRenderer: undefined,
    loaderRenderer: undefined,
    layoutRenderer: undefined,
    initialStep: 0,
    onTransition: _noop3.default,
    onFinish: _noop3.default,
    onStart: _noop3.default,
    form: {}
};

exports.default = createComponent(Wizard, {
    modules: ["Form", "Loader"]
});
//# sourceMappingURL=Wizard.js.map
