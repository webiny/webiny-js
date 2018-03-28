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

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["{files|count:1:file:default:files} selected"],
        ["{files|count:1:file:default:files} selected"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["A file could not be selected"],
        ["A file could not be selected"]
    ),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(
        ["Some files could not be selected"],
        ["Some files could not be selected"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.File");

var SimpleFile = (function(_React$Component) {
    (0, _inherits3.default)(SimpleFile, _React$Component);

    function SimpleFile(props) {
        (0, _classCallCheck3.default)(this, SimpleFile);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (SimpleFile.__proto__ || Object.getPrototypeOf(SimpleFile)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState);
        ["fileChanged", "filesChanged", "getFiles", "clearFiles"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(SimpleFile, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }
            }
        },
        {
            key: "clearFiles",
            value: function clearFiles() {
                var _this2 = this;

                this.props.onChange(null).then(function() {
                    _this2.setState({ isValid: null });
                });
            }
        },
        {
            key: "fileChanged",
            value: function fileChanged(file, error) {
                if (error) {
                    this.setState({ error: error });
                    return;
                }

                if ((0, _has3.default)(file, "data")) {
                    this.props.onChange(file).then(this.props.validate);
                }
            }
        },
        {
            key: "filesChanged",
            value: function filesChanged(files, errors) {
                if (errors.length > 0) {
                    this.setState({ errors: errors });
                }

                if (files.length > 0) {
                    this.props.onChange(files).then(this.props.validate);
                }
            }
        },
        {
            key: "getFiles",
            value: function getFiles(e) {
                this.setState({ error: null, errors: null });
                e.stopPropagation();
                if (this.props.onGetFiles) {
                    this.props.onGetFiles({ $this: this });
                    return;
                }
                this.reader.getFiles();
            }
        },
        {
            key: "renderValue",
            value: function renderValue() {
                if (this.props.multiple) {
                    return this.props.value
                        ? t(_templateObject)({
                              files: (0, _get3.default)(this.props.value, "length", 0)
                          })
                        : "";
                }

                return (0, _get3.default)(this.props.value, "name", "");
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    FileReader = _props.FileReader,
                    FormGroup = _props.FormGroup,
                    styles = _props.styles;

                var fileReaderProps = {
                    accept: this.props.accept,
                    onReady: function onReady(reader) {
                        return (_this3.reader = reader);
                    },
                    onChange: this.props.multiple ? this.filesChanged : this.fileChanged,
                    multiple: this.props.multiple,
                    readAs: this.props.readAs,
                    sizeLimit: this.props.sizeLimit
                };
                var fileReader = _react2.default.createElement(FileReader, fileReaderProps);

                var clearBtn = null;
                if (this.props.value) {
                    clearBtn = _react2.default.createElement(
                        "div",
                        {
                            className: [styles.fileBtn, styles.clearBtn, styles.clearBtnIcon].join(
                                " "
                            ),
                            onClick: this.clearFiles
                        },
                        _react2.default.createElement("span", null, "Clear")
                    );
                }

                var error = null;
                if (this.state.error || this.state.errors) {
                    error = this.props.multiple
                        ? this.props.renderErrors.call(this)
                        : this.props.renderError.call(this);
                }

                return _react2.default.createElement(
                    FormGroup,
                    { valid: this.state.isValid, className: this.props.className },
                    this.props.renderLabel.call(this),
                    _react2.default.createElement("div", null, error),
                    _react2.default.createElement(
                        "div",
                        { className: styles.wrapper + " inputGroup" },
                        _react2.default.createElement("input", {
                            type: "text",
                            placeholder: this.props.placeholder,
                            readOnly: true,
                            onClick: this.getFiles,
                            className: styles.input,
                            value: this.renderValue(),
                            onChange: _noop3.default
                        }),
                        clearBtn,
                        _react2.default.createElement(
                            "div",
                            {
                                className: styles.fileBtn + " " + styles.uploadBtn,
                                onClick: this.getFiles
                            },
                            _react2.default.createElement("span", null, "Select"),
                            fileReader
                        ),
                        this.props.renderDescription.call(this),
                        this.props.renderValidationMessage.call(this)
                    )
                );
            }
        }
    ]);
    return SimpleFile;
})(_react2.default.Component);

SimpleFile.defaultProps = {
    accept: [],
    multiple: false,
    sizeLimit: 2485760,
    readAs: "data", // or binary
    onGetFiles: null,
    renderError: function renderError() {
        var Alert = this.props.Alert;

        return _react2.default.createElement(
            Alert,
            { title: t(_templateObject2), type: "error", close: true },
            _react2.default.createElement(
                "ul",
                null,
                _react2.default.createElement(
                    "li",
                    null,
                    _react2.default.createElement("strong", null, this.state.error.name),
                    ": ",
                    this.state.error.message
                )
            )
        );
    },
    renderErrors: function renderErrors() {
        var Alert = this.props.Alert;

        var data = [];
        (0, _each3.default)(this.state.errors, function(err, key) {
            data.push(
                _react2.default.createElement(
                    "li",
                    { key: key },
                    _react2.default.createElement("strong", null, err.name),
                    ": ",
                    err.message
                )
            );
        });

        return _react2.default.createElement(
            Alert,
            { title: t(_templateObject3), type: "error", close: true },
            data && _react2.default.createElement("ul", null, data)
        );
    }
};

exports.default = (0, _webinyApp.createComponent)([SimpleFile, _webinyAppUi.FormComponent], {
    modules: ["FileReader", "FormGroup", "Alert"],
    styles: _styles2.default,
    formComponent: true
});
//# sourceMappingURL=index.js.map
