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

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyClient = require("webiny-client");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.I18N.TextsList
 */
var LocalesModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(LocalesModal, _Webiny$Ui$ModalCompo);

    function LocalesModal() {
        (0, _classCallCheck3.default)(this, LocalesModal);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (LocalesModal.__proto__ || Object.getPrototypeOf(LocalesModal)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(LocalesModal, [
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _this2 = this;

                var _props = this.props,
                    Button = _props.Button,
                    Modal = _props.Modal,
                    Link = _props.Link,
                    Grid = _props.Grid,
                    Form = _props.Form,
                    Select = _props.Select,
                    Switch = _props.Switch,
                    Section = _props.Section,
                    Input = _props.Input;

                return _react2.default.createElement(
                    Modal.Dialog,
                    { wide: true },
                    _react2.default.createElement(
                        Form,
                        {
                            id: _lodash2.default.get(this.props, "data.id"),
                            defaultModel: {
                                formats: _webinyClient.Webiny.I18n.getDefaultFormats()
                            },
                            fields: "key,label,formats,default,enabled",
                            api: "/entities/webiny/i18n-locales",
                            onSubmitSuccess: function onSubmitSuccess(apiResponse) {
                                return _this2.hide().then(function() {
                                    return _this2.props.onSubmitSuccess(apiResponse);
                                });
                            },
                            onSuccessMessage: null
                        },
                        function(_ref) {
                            var model = _ref.model,
                                form = _ref.form;

                            var id = _lodash2.default.get(_this2.props, "data.id");
                            var url = id ? "/available/" + id : "/available";
                            return _react2.default.createElement(
                                Modal.Content,
                                null,
                                _react2.default.createElement(Form.Loader, null),
                                _react2.default.createElement(Modal.Header, {
                                    title: id
                                        ? _this2.i18n("Edit Locale")
                                        : _this2.i18n("Create Locale"),
                                    onClose: _this2.hide
                                }),
                                _react2.default.createElement(
                                    Modal.Body,
                                    null,
                                    _react2.default.createElement(Form.Error, null),
                                    _react2.default.createElement(
                                        Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(Select, {
                                                label: _this2.i18n("Locale"),
                                                description: _this2.i18n(
                                                    "Already added locales are not listed."
                                                ),
                                                placeholder: _this2.i18n("Select locale to add..."),
                                                name: "key",
                                                validate: "required",
                                                api: "/entities/webiny/i18n-locales",
                                                url: url
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 5 },
                                            _react2.default.createElement(Switch, {
                                                description: _this2.i18n(
                                                    "Only one locale can be set as default."
                                                ),
                                                label: _this2.i18n("Default"),
                                                name: "default"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 5 },
                                            _react2.default.createElement(Switch, {
                                                description: _this2.i18n(
                                                    "Set whether or not this locale is available for the public."
                                                ),
                                                label: _this2.i18n("Enabled"),
                                                name: "enabled"
                                            })
                                        )
                                    ),
                                    _react2.default.createElement(Section, {
                                        title: _this2.i18n("Dates")
                                    }),
                                    _react2.default.createElement(
                                        Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 7 },
                                            _react2.default.createElement(Input, {
                                                label: _this2.i18n("Date"),
                                                name: "formats.date",
                                                placeholder: _this2.i18n("eg. d/m/Y")
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 5 },
                                            _react2.default.createElement(Input, {
                                                disabled: true,
                                                label: _this2.i18n("Preview"),
                                                value: _webinyClient.Webiny.I18n.date(
                                                    new Date(),
                                                    model.formats.date
                                                ),
                                                placeholder: _this2.i18n(
                                                    "Type format to see example."
                                                )
                                            })
                                        )
                                    ),
                                    _react2.default.createElement(
                                        Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 7 },
                                            _react2.default.createElement(Input, {
                                                label: _this2.i18n("Time"),
                                                name: "formats.time",
                                                placeholder: _this2.i18n("eg. h:i")
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 5 },
                                            _react2.default.createElement(Input, {
                                                disabled: true,
                                                label: _this2.i18n("Preview"),
                                                value: _webinyClient.Webiny.I18n.time(
                                                    new Date(),
                                                    model.formats.time
                                                ),
                                                placeholder: _this2.i18n(
                                                    "Type format to see example."
                                                )
                                            })
                                        )
                                    ),
                                    _react2.default.createElement(
                                        Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 7 },
                                            _react2.default.createElement(Input, {
                                                label: _this2.i18n("Date/Time"),
                                                name: "formats.datetime",
                                                placeholder: _this2.i18n("eg. d/m/Y h:i")
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 5 },
                                            _react2.default.createElement(Input, {
                                                disabled: true,
                                                label: _this2.i18n("Preview"),
                                                value: _webinyClient.Webiny.I18n.datetime(
                                                    new Date(),
                                                    model.formats.datetime
                                                ),
                                                placeholder: _this2.i18n(
                                                    "Type format to see example."
                                                )
                                            })
                                        )
                                    ),
                                    _react2.default.createElement(Section, {
                                        title: _this2.i18n("Prices")
                                    }),
                                    _react2.default.createElement(
                                        Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 2 },
                                            _react2.default.createElement(Input, {
                                                tooltip: _this2.i18n(
                                                    "Use {value} and {symbol} placeholders to define output."
                                                ),
                                                label: _this2.i18n("Format"),
                                                placeholder: _this2.i18n('eg. "{value}{symbol}"'),
                                                name: "formats.price.format"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 2 },
                                            _react2.default.createElement(Input, {
                                                label: _this2.i18n("Symbol"),
                                                placeholder: _this2.i18n('eg. "$"'),
                                                name: "formats.price.symbol"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 2 },
                                            _react2.default.createElement(Input, {
                                                label: _this2.i18n("Decimal"),
                                                placeholder: _this2.i18n('eg. "."'),
                                                name: "formats.price.decimal"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 2 },
                                            _react2.default.createElement(Input, {
                                                label: _this2.i18n("Thousand"),
                                                placeholder: _this2.i18n('eg. ","'),
                                                name: "formats.price.thousand"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 2 },
                                            _react2.default.createElement(Input, {
                                                label: _this2.i18n("Precision"),
                                                placeholder: _this2.i18n('eg. "2"'),
                                                name: "formats.price.precision"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 2 },
                                            _react2.default.createElement(Input, {
                                                disabled: true,
                                                label: _this2.i18n("Preview"),
                                                value: _webinyClient.Webiny.I18n.price(
                                                    12345.67,
                                                    model.formats.price
                                                ),
                                                placeholder: _this2.i18n(
                                                    "Type format to see example."
                                                )
                                            })
                                        )
                                    ),
                                    _react2.default.createElement(Section, {
                                        title: _this2.i18n("Numbers")
                                    }),
                                    _react2.default.createElement(
                                        Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 2 },
                                            _react2.default.createElement(Input, {
                                                label: _this2.i18n("Decimal"),
                                                placeholder: _this2.i18n('eg. "."'),
                                                name: "formats.number.decimal"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 2 },
                                            _react2.default.createElement(Input, {
                                                label: _this2.i18n("Thousand"),
                                                placeholder: _this2.i18n('eg. ","'),
                                                name: "formats.number.thousand"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 2 },
                                            _react2.default.createElement(Input, {
                                                label: _this2.i18n("Precision"),
                                                placeholder: _this2.i18n('eg. "2"'),
                                                name: "formats.number.precision"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 2 },
                                            _react2.default.createElement(Input, {
                                                disabled: true,
                                                label: _this2.i18n("Preview"),
                                                value: _webinyClient.Webiny.I18n.number(
                                                    12345.67,
                                                    model.formats.number
                                                ),
                                                placeholder: _this2.i18n(
                                                    "Type format to see example."
                                                )
                                            })
                                        )
                                    )
                                ),
                                _react2.default.createElement(
                                    Modal.Footer,
                                    null,
                                    _react2.default.createElement(Button, {
                                        label: _this2.i18n("Cancel"),
                                        onClick: _this2.hide
                                    }),
                                    _react2.default.createElement(Button, {
                                        type: "primary",
                                        label: _this2.i18n("Save"),
                                        onClick: form.submit
                                    })
                                )
                            );
                        }
                    ),
                    ")}"
                );
            }
        }
    ]);
    return LocalesModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

LocalesModal.defaultProps = _lodash2.default.assign(
    {},
    _webinyClient.Webiny.Ui.ModalComponent.defaultProps,
    {
        onSubmitSuccess: _lodash2.default.noop
    }
);

exports.default = _webinyClient.Webiny.createComponent(LocalesModal, {
    modules: ["Button", "Modal", "Link", "Grid", "Form", "Select", "Switch", "Section", "Input"]
});
//# sourceMappingURL=LocalesModal.js.map
