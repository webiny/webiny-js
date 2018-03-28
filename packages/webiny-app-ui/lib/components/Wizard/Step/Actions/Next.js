"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

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

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Next"], ["Next"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Wizard.Actions.Previous");

var Next = (function(_React$Component) {
    (0, _inherits3.default)(Next, _React$Component);

    function Next() {
        (0, _classCallCheck3.default)(this, Next);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Next.__proto__ || Object.getPrototypeOf(Next)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Next, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    Button = _props.Button,
                    _onClick = _props.onClick,
                    render = _props.render,
                    wizard = _props.wizard,
                    props = (0, _objectWithoutProperties3.default)(_props, [
                        "Button",
                        "onClick",
                        "render",
                        "wizard"
                    ]);

                if (render) {
                    return render.call(this);
                }

                if (wizard.isLastStep()) {
                    return null;
                }

                var btnProps = Object.assign(
                    {
                        type: "primary",
                        onClick: (function() {
                            var _ref = (0, _asyncToGenerator3.default)(
                                /*#__PURE__*/ _regenerator2.default.mark(function _callee() {
                                    return _regenerator2.default.wrap(
                                        function _callee$(_context) {
                                            while (1) {
                                                switch ((_context.prev = _context.next)) {
                                                    case 0:
                                                        _context.next = 2;
                                                        return _onClick();

                                                    case 2:
                                                        _this2.wizard.form
                                                            .validate()
                                                            .then(function(valid) {
                                                                return valid && wizard.nextStep();
                                                            });

                                                    case 3:
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

                            function onClick() {
                                return _ref.apply(this, arguments);
                            }

                            return onClick;
                        })(),
                        align: "right",
                        icon: "fa-arrow-circle-right"
                    },
                    props
                );

                return _react2.default.createElement(Button, btnProps);
            }
        }
    ]);
    return Next;
})(_react2.default.Component);

// Receives all standard Button component props

Next.defaultProps = {
    wizard: null,
    onClick: _noop3.default,
    label: t(_templateObject)
};

exports.default = (0, _webinyApp.createComponent)(Next, { modules: ["Button"] });
//# sourceMappingURL=Next.js.map
