"use strict";

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Export summary"], ["Export summary"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Filter by status"],
        ["Filter by status"]
    ),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(["All records"], ["All records"]),
    _templateObject4 = (0, _taggedTemplateLiteral3.default)(
        ["Records will be filtered based on your selection"],
        ["Records will be filtered based on your selection"]
    ),
    _templateObject5 = (0, _taggedTemplateLiteral3.default)(["Cancel"], ["Cancel"]),
    _templateObject6 = (0, _taggedTemplateLiteral3.default)(["Export"], ["Export"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = i18n.namespace("Webiny.Ui.Downloader.Ideas.Example");
_react2.default.createElement(
    Ui.Download,
    null,
    _react2.default.createElement(Ui.Download.Element, null, function(_ref) {
        var download = _ref.download;
        return _react2.default.createElement(
            Ui.Link,
            { type: "secondary", align: "right", onClick: download },
            _react2.default.createElement(Ui.Icon, { icon: "icon-file-o" }),
            " Export summary"
        );
    }),
    _react2.default.createElement(Ui.Download.Dialog, null, function(_ref2) {
        var download = _ref2.download;

        var submit = function submit(_ref3) {
            var filters = _ref3.model;
            return download("GET", "/entities/demo/records/report/summary", null, filters);
        };
        return _react2.default.createElement(Ui.Modal.Dialog, null, function(_ref4) {
            var dialog = _ref4.dialog;
            return _react2.default.createElement(Ui.Form, { onSubmit: submit }, function(_ref5) {
                var form = _ref5.form;
                return _react2.default.createElement(
                    Ui.Modal.Content,
                    null,
                    _react2.default.createElement(Ui.Modal.Header, {
                        title: undefined.t(_templateObject)
                    }),
                    _react2.default.createElement(
                        Ui.Modal.Body,
                        null,
                        _react2.default.createElement(
                            Ui.Grid.Row,
                            null,
                            _react2.default.createElement(
                                Ui.Grid.Col,
                                { all: 12 },
                                _react2.default.createElement(
                                    Ui.Select,
                                    {
                                        name: "enabled",
                                        validate: "required",
                                        label: undefined.t(_templateObject2),
                                        placeholder: undefined.t(_templateObject3),
                                        allowClear: true,
                                        description: undefined.t(_templateObject4)
                                    },
                                    _react2.default.createElement(
                                        "option",
                                        { value: "true" },
                                        "Enabled"
                                    ),
                                    _react2.default.createElement(
                                        "option",
                                        { value: "false" },
                                        "Disabled"
                                    )
                                )
                            )
                        )
                    ),
                    _react2.default.createElement(
                        Ui.Modal.Footer,
                        null,
                        _react2.default.createElement(Ui.Button, {
                            type: "default",
                            label: undefined.t(_templateObject5),
                            onClick: dialog.hide
                        }),
                        _react2.default.createElement(Ui.Button, {
                            type: "primary",
                            label: undefined.t(_templateObject6),
                            onClick: form.submit
                        })
                    )
                );
            });
        });
    })
);
//# sourceMappingURL=Example.js.map
