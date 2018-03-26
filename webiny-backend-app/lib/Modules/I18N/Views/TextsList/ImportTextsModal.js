"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.I18N.ImportTexts
 */
var ImportTextsModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(ImportTextsModal, _Webiny$Ui$ModalCompo);

    function ImportTextsModal() {
        (0, _classCallCheck3.default)(this, ImportTextsModal);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ImportTextsModal.__proto__ || Object.getPrototypeOf(ImportTextsModal)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(ImportTextsModal, [
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _this2 = this;

                var Ui = this.props.Ui;

                return _react2.default.createElement(
                    Ui.Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        Ui.Form,
                        {
                            api: "/entities/webiny/i18n-texts",
                            url: "/import/zip",
                            defaultModel: { options: { overwriteExisting: true } },
                            onSubmit: (function() {
                                var _ref2 = (0, _asyncToGenerator3.default)(
                                    /*#__PURE__*/ _regenerator2.default.mark(function _callee(
                                        _ref
                                    ) {
                                        var model = _ref.model,
                                            form = _ref.form;
                                        var preview, response;
                                        return _regenerator2.default.wrap(
                                            function _callee$(_context) {
                                                while (1) {
                                                    switch ((_context.prev = _context.next)) {
                                                        case 0:
                                                            form.showLoading();
                                                            preview = model.options.preview;

                                                            form.setModel({ response: null });
                                                            _context.next = 5;
                                                            return form.api.post(
                                                                "/import/json",
                                                                model
                                                            );

                                                        case 5:
                                                            response = _context.sent;

                                                            form.hideLoading();

                                                            if (!response.isError()) {
                                                                _context.next = 9;
                                                                break;
                                                            }

                                                            return _context.abrupt(
                                                                "return",
                                                                form.handleApiError(response)
                                                            );

                                                        case 9:
                                                            form.setModel(
                                                                {
                                                                    results: {
                                                                        preview: preview,
                                                                        data: response.getData()
                                                                    }
                                                                },
                                                                function() {
                                                                    return (
                                                                        !preview &&
                                                                        _this2.props.onTextsImported()
                                                                    );
                                                                }
                                                            );

                                                        case 10:
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
                                    return _ref2.apply(this, arguments);
                                };
                            })()
                        },
                        function(_ref3) {
                            var model = _ref3.model,
                                form = _ref3.form;

                            var results = null;
                            if (model.results) {
                                if (model.results.preview) {
                                    results = _react2.default.createElement(
                                        Ui.Alert,
                                        null,
                                        _this2.i18n(
                                            "Export file is valid. After importing, following changes will be applied:"
                                        ),
                                        _react2.default.createElement(
                                            "ul",
                                            null,
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} created", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.created
                                                    )
                                                })
                                            ),
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} updated", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.updated
                                                    )
                                                })
                                            ),
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} ignored", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.ignored
                                                    )
                                                })
                                            )
                                        ),
                                        _this2.i18n(
                                            "The following changes will be applied to text groups:"
                                        ),
                                        _react2.default.createElement(
                                            "ul",
                                            null,
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} created", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.groups.created
                                                    )
                                                })
                                            ),
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} updated", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.groups.updated
                                                    )
                                                })
                                            ),
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} ignored", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.groups.ignored
                                                    )
                                                })
                                            )
                                        )
                                    );
                                } else {
                                    results = _react2.default.createElement(
                                        Ui.Alert,
                                        { type: "success" },
                                        _this2.i18n(
                                            "Translations were successfully imported! following changes were applied:"
                                        ),
                                        _react2.default.createElement(
                                            "ul",
                                            null,
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} created", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.created
                                                    )
                                                })
                                            ),
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} updated", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.updated
                                                    )
                                                })
                                            ),
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} ignored", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.ignored
                                                    )
                                                })
                                            )
                                        ),
                                        _this2.i18n(
                                            "The following changes were applied to text groups:"
                                        ),
                                        _react2.default.createElement(
                                            "ul",
                                            null,
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} created", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.groups.created
                                                    )
                                                })
                                            ),
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} updated", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.groups.updated
                                                    )
                                                })
                                            ),
                                            _react2.default.createElement(
                                                "li",
                                                null,
                                                _this2.i18n("{num} ignored", {
                                                    num: _react2.default.createElement(
                                                        "strong",
                                                        null,
                                                        model.results.data.groups.ignored
                                                    )
                                                })
                                            )
                                        )
                                    );
                                }
                            }

                            return _react2.default.createElement(
                                Ui.Modal.Content,
                                null,
                                _react2.default.createElement(Ui.Form.Loader, null),
                                _react2.default.createElement(Ui.Modal.Header, {
                                    title: _this2.i18n("Import texts"),
                                    onClose: _this2.hide
                                }),
                                _react2.default.createElement(
                                    Ui.Modal.Body,
                                    null,
                                    _react2.default.createElement(Ui.Form.Error, null),
                                    results,
                                    _react2.default.createElement(
                                        Ui.Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Ui.Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(Ui.File, {
                                                validate: "required",
                                                placeholder: _this2.i18n("JSON file"),
                                                label: _this2.i18n("Choose File"),
                                                name: "file",
                                                accept: ["application/json"]
                                            })
                                        )
                                    ),
                                    _react2.default.createElement(Ui.Section, {
                                        title: _this2.i18n("Options")
                                    }),
                                    _react2.default.createElement(
                                        Ui.Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Ui.Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(Ui.Checkbox, {
                                                name: "options.overwriteExisting",
                                                label: _this2.i18n("Overwrite existing keys"),
                                                tooltip: _this2.i18n(
                                                    "Previously imported texts will be overwritten."
                                                )
                                            }),
                                            _react2.default.createElement(Ui.Checkbox, {
                                                name: "options.preview",
                                                label: _this2.i18n("Preview")
                                            })
                                        )
                                    )
                                ),
                                _react2.default.createElement(
                                    Ui.Modal.Footer,
                                    null,
                                    _react2.default.createElement(Ui.Button, {
                                        label: _this2.i18n("Cancel"),
                                        onClick: _this2.hide
                                    }),
                                    _react2.default.createElement(Ui.Button, {
                                        type: "primary",
                                        label: _this2.i18n("Import"),
                                        onClick: form.submit
                                    })
                                )
                            );
                        }
                    )
                );
            }
        }
    ]);
    return ImportTextsModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

ImportTextsModal.defaultProps = _lodash2.default.assign(
    {},
    _webinyClient.Webiny.Ui.ModalComponent.defaultProps,
    {
        onTextsImported: _lodash2.default.noop
    }
);

exports.default = _webinyClient.Webiny.createComponent(ImportTextsModal, {
    modulesProp: "Ui",
    modules: [
        "Modal",
        "Form",
        "Grid",
        "CheckboxGroup",
        "Checkbox",
        "Button",
        "File",
        "Section",
        "Alert"
    ]
});
//# sourceMappingURL=ImportTextsModal.js.map
