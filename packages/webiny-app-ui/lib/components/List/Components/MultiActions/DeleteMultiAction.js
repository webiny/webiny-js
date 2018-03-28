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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _map2 = require("lodash/map");

var _map3 = _interopRequireDefault(_map2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["{count} records deleted successfully!"],
        ["{count} records deleted successfully!"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["Delete failed"], ["Delete failed"]),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(["Delete"], ["Delete"]),
    _templateObject4 = (0, _taggedTemplateLiteral3.default)(
        ["Delete confirmation"],
        ["Delete confirmation"]
    ),
    _templateObject5 = (0, _taggedTemplateLiteral3.default)(
        ["Do you really want to delete {count} record(s)?"],
        ["Do you really want to delete {count} record(s)?"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _ModalMultiAction = require("./ModalMultiAction");

var _ModalMultiAction2 = _interopRequireDefault(_ModalMultiAction);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.List.MultiActions.DeleteMultiAction");

var DeleteMultiAction = (function(_React$Component) {
    (0, _inherits3.default)(DeleteMultiAction, _React$Component);

    function DeleteMultiAction(props) {
        (0, _classCallCheck3.default)(this, DeleteMultiAction);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (DeleteMultiAction.__proto__ || Object.getPrototypeOf(DeleteMultiAction)).call(
                this,
                props
            )
        );

        _this.dialogId = (0, _uniqueId3.default)("delete-multi-action-modal-");

        ["delete", "formatMessage"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(DeleteMultiAction, [
        {
            key: "formatMessage",
            value: function formatMessage() {
                var _props = this.props,
                    message = _props.message,
                    data = _props.data;

                if ((0, _isFunction3.default)(message)) {
                    return message({ data: data });
                }
                return this.props.message.replace("{count}", this.props.data.length);
            }
        },
        {
            key: "delete",
            value: function _delete(_ref) {
                var data = _ref.data,
                    actions = _ref.actions,
                    dialog = _ref.dialog;
                var api = this.props.actions.api;

                return api
                    .post(api.defaults.url + "/delete", { ids: (0, _map3.default)(data, "id") })
                    .then(function(response) {
                        var growler = _webinyApp.app.services.get("growler");
                        if (response.statusCode >= 200) {
                            growler.success(t(_templateObject)({ count: data.length }));
                            actions.reload();
                        } else {
                            growler.danger(
                                (0, _get3.default)(response, "data.message", response.statusText),
                                t(_templateObject2),
                                true
                            );
                        }
                        return dialog.hide();
                    });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props2 = this.props,
                    Modal = _props2.Modal,
                    actions = _props2.actions,
                    label = _props2.label,
                    data = _props2.data,
                    children = _props2.children;

                var content = (0, _isFunction3.default)(children)
                    ? children
                    : function(_ref2) {
                          var data = _ref2.data,
                              actions = _ref2.actions,
                              dialog = _ref2.dialog;

                          var props = {
                              name: _this2.dialogId,
                              title: _this2.props.title,
                              message: _this2.formatMessage(),
                              onConfirm: function onConfirm() {
                                  return _this2.props.onConfirm.call(_this2, {
                                      data: data,
                                      actions: actions,
                                      dialog: dialog
                                  });
                              }
                          };
                          return _react2.default.createElement(Modal.Confirmation, props);
                      };

                return _react2.default.createElement(
                    _ModalMultiAction2.default,
                    { actions: actions, label: label, data: data },
                    content
                );
            }
        }
    ]);
    return DeleteMultiAction;
})(_react2.default.Component);

DeleteMultiAction.defaultProps = {
    label: t(_templateObject3),
    title: t(_templateObject4),
    message: t(_templateObject5),
    actions: null,
    data: [],
    onConfirm: function onConfirm(params) {
        return this.delete(params);
    }
};

exports.default = (0, _webinyApp.createComponent)(DeleteMultiAction, { modules: ["Modal"] });
//# sourceMappingURL=DeleteMultiAction.js.map
