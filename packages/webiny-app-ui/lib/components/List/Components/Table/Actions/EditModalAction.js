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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _ModalAction = require("./ModalAction");

var _ModalAction2 = _interopRequireDefault(_ModalAction);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var EditModalAction = (function(_React$Component) {
    (0, _inherits3.default)(EditModalAction, _React$Component);

    function EditModalAction() {
        (0, _classCallCheck3.default)(this, EditModalAction);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (EditModalAction.__proto__ || Object.getPrototypeOf(EditModalAction)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(EditModalAction, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var $this = this;
                return _react2.default.createElement(
                    _ModalAction2.default,
                    (0, _pick3.default)($this.props, "data", "actions", "label", "hide", "icon"),
                    function render(_ref) {
                        var data = _ref.data,
                            actions = _ref.actions,
                            modal = _ref.modal;

                        var props = (0, _omit3.default)($this.props.children.props, ["key", "ref"]);
                        (0, _assign3.default)(props, {
                            data: data,
                            actions: actions,
                            modal: modal
                        });
                        return _react2.default.cloneElement($this.props.children, props);
                    }
                );
            }
        }
    ]);
    return EditModalAction;
})(_react2.default.Component);

EditModalAction.defaultProps = {
    label: "Edit"
};

exports.default = EditModalAction;
//# sourceMappingURL=EditModalAction.js.map
