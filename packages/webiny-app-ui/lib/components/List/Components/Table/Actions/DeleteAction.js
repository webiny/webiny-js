"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

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

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Delete"], ["Delete"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Delete confirmation"],
        ["Delete confirmation"]
    ),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(
        ["Are you sure you want to delete this record?"],
        ["Are you sure you want to delete this record?"]
    ),
    _templateObject4 = (0, _taggedTemplateLiteral3.default)(["Yes, delete!"], ["Yes, delete!"]),
    _templateObject5 = (0, _taggedTemplateLiteral3.default)(["No"], ["No"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _ModalAction = require("./ModalAction");

var _ModalAction2 = _interopRequireDefault(_ModalAction);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.List.Table.Actions");

var DeleteAction = (function(_React$Component) {
    (0, _inherits3.default)(DeleteAction, _React$Component);

    function DeleteAction() {
        (0, _classCallCheck3.default)(this, DeleteAction);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (DeleteAction.__proto__ || Object.getPrototypeOf(DeleteAction)).call(this)
        );

        _this.dialogId = (0, _uniqueId3.default)("delete-action-modal-");
        return _this;
    }

    (0, _createClass3.default)(DeleteAction, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    message = _props.message,
                    Modal = _props.Modal;

                var $this = this;

                return _react2.default.createElement(
                    _ModalAction2.default,
                    (0, _pick3.default)(
                        this.props,
                        "data",
                        "actions",
                        "label",
                        "hide",
                        "afterDelete",
                        "icon"
                    ),
                    function render(_ref) {
                        var data = _ref.data,
                            actions = _ref.actions,
                            dialog = _ref.dialog;

                        var props = {
                            name: $this.dialogId,
                            title: $this.props.title,
                            confirm: $this.props.confirmButtonLabel,
                            cancel: $this.props.cancelButtonLabel,
                            message: message,
                            onComplete: function onComplete() {
                                actions.reload();
                            },
                            onConfirm: function onConfirm() {
                                $this.props.onConfirm.call($this, {
                                    data: data,
                                    actions: actions,
                                    dialog: dialog
                                });
                            }
                        };
                        return _react2.default.createElement(Modal.Confirmation, props);
                    }
                );
            }
        }
    ]);
    return DeleteAction;
})(_react2.default.Component);

DeleteAction.defaultProps = {
    label: t(_templateObject),
    title: t(_templateObject2),
    icon: "icon-cancel",
    message: t(_templateObject3),
    confirmButtonLabel: t(_templateObject4),
    cancelButtonLabel: t(_templateObject5),
    hide: _noop3.default,
    afterDelete: _noop3.default,
    onConfirm: function onConfirm(_ref2) {
        var _this2 = this;

        var data = _ref2.data,
            actions = _ref2.actions,
            dialog = _ref2.dialog;

        return actions.delete(data.id, false).then(function(res) {
            return Promise.resolve(_this2.props.afterDelete(res)).then(function() {
                return res;
            });
        });
    }
};

exports.default = (0, _webinyApp.createComponent)(DeleteAction, { modules: ["Modal"] });
//# sourceMappingURL=DeleteAction.js.map
