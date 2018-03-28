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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var AlertContainer = (function(_React$Component) {
    (0, _inherits3.default)(AlertContainer, _React$Component);

    function AlertContainer(props) {
        (0, _classCallCheck3.default)(this, AlertContainer);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (AlertContainer.__proto__ || Object.getPrototypeOf(AlertContainer)).call(this, props)
        );

        _this.state = {
            closed: false
        };

        _this.mounted = false;
        return _this;
    }

    (0, _createClass3.default)(AlertContainer, [
        {
            key: "close",
            value: function close() {
                var _this2 = this;

                Promise.resolve(this.props.onClose()).then(function() {
                    if (_this2.mounted) {
                        _this2.setState({ closed: true });
                    }
                });
            }
        },
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.mounted = true;
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
                if (this.state.closed) {
                    return null;
                }

                return this.props.children(this.close.bind(this));
            }
        }
    ]);
    return AlertContainer;
})(_react2.default.Component);

exports.default = AlertContainer;
//# sourceMappingURL=Container.js.map
