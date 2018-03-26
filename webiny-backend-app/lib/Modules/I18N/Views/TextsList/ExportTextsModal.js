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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.I18N.ExportTextsModal
 */
var ExportTextsModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(ExportTextsModal, _Webiny$Ui$ModalCompo);

    function ExportTextsModal() {
        (0, _classCallCheck3.default)(this, ExportTextsModal);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ExportTextsModal.__proto__ || Object.getPrototypeOf(ExportTextsModal)).call(this)
        );

        _this.state = { groups: [] };
        return _this;
    }

    (0, _createClass3.default)(ExportTextsModal, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                (0, _get3.default)(
                    ExportTextsModal.prototype.__proto__ ||
                        Object.getPrototypeOf(ExportTextsModal.prototype),
                    "componentWillMount",
                    this
                ).call(this);
                _webinyClient.Webiny.I18n.getTextGroups().then(function(groups) {
                    return _this2.setState({ groups: groups });
                });
            }
        },
        {
            key: "getAvailableGroups",
            value: function getAvailableGroups(apps) {
                var output = [{ id: "none", name: "Texts without group" }];
                this.state.groups.forEach(function(group) {
                    if (_lodash2.default.includes(apps, group.app)) {
                        output.push(group);
                    }
                });

                return output;
            }
        },
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _this3 = this;

                var Ui = this.props.Ui;

                return _react2.default.createElement(
                    Ui.Modal.Dialog,
                    null,
                    _react2.default.createElement(Ui.Form, null, function(_ref) {
                        var model = _ref.model;

                        var availableGroups = _this3.getAvailableGroups(model.apps);
                        return _react2.default.createElement(
                            Ui.Modal.Content,
                            null,
                            _react2.default.createElement(Ui.Form.Loader, null),
                            _react2.default.createElement(Ui.Modal.Header, {
                                title: _this3.i18n("Export texts"),
                                onClose: _this3.hide
                            }),
                            _react2.default.createElement(
                                Ui.Modal.Body,
                                null,
                                _react2.default.createElement(Ui.Form.Error, null),
                                _react2.default.createElement(
                                    Ui.Grid.Row,
                                    null,
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 12 },
                                        _react2.default.createElement(Ui.CheckboxGroup, {
                                            validate: "required",
                                            name: "apps",
                                            label: _this3.i18n("Select apps to export"),
                                            api: "/services/webiny/apps",
                                            url: "/installed",
                                            textAttr: "name",
                                            valueAttr: "name"
                                        })
                                    )
                                ),
                                !_lodash2.default.isEmpty(availableGroups) &&
                                    _react2.default.createElement(
                                        Ui.Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Ui.Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(Ui.CheckboxGroup, {
                                                tooltip: _this3.i18n(
                                                    "Only groups from selected apps are shown."
                                                ),
                                                validate: "required",
                                                name: "groups",
                                                textAttr: "name",
                                                options: availableGroups,
                                                label: _this3.i18n("Select groups to export")
                                            })
                                        )
                                    )
                            ),
                            _react2.default.createElement(
                                Ui.Modal.Footer,
                                null,
                                _react2.default.createElement(Ui.Button, {
                                    label: _this3.i18n("Cancel"),
                                    onClick: _this3.hide
                                }),
                                _react2.default.createElement(
                                    Ui.DownloadLink,
                                    {
                                        separate: true,
                                        disabled: _lodash2.default.isEmpty(model.apps),
                                        onClick: function onClick() {
                                            return _this3.hide();
                                        },
                                        method: "POST",
                                        params: model,
                                        type: "primary",
                                        download:
                                            _webinyClient.Webiny.Config.ApiUrl +
                                            "/entities/webiny/i18n-texts/export/json"
                                    },
                                    _this3.i18n("Export")
                                )
                            )
                        );
                    })
                );
            }
        }
    ]);
    return ExportTextsModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

ExportTextsModal.defaultProps = _lodash2.default.assign(
    {},
    _webinyClient.Webiny.Ui.ModalComponent.defaultProps
);

exports.default = _webinyClient.Webiny.createComponent(ExportTextsModal, {
    modulesProp: "Ui",
    modules: ["Modal", "Form", "Grid", "CheckboxGroup", "Checkbox", "Button", "DownloadLink"]
});
//# sourceMappingURL=ExportTextsModal.js.map
