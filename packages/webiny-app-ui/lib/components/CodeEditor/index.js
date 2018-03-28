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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _isNull2 = require("lodash/isNull");

var _isNull3 = _interopRequireDefault(_isNull2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var CodeEditor = (function(_React$Component) {
    (0, _inherits3.default)(CodeEditor, _React$Component);

    function CodeEditor(props) {
        (0, _classCallCheck3.default)(this, CodeEditor);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (CodeEditor.__proto__ || Object.getPrototypeOf(CodeEditor)).call(this, props)
        );

        _this.state = {};

        _this.delayedOnChange = null;
        _this.codeMirror = null;
        _this.options = {
            lineNumbers: true,
            htmlMode: true,
            mode: props.mode, // needs to be built into CodeMirror vendor
            theme: props.theme, // needs to be built into CodeMirror vendor
            readOnly: props.readOnly
        };

        _this.textarea = null;
        _this.getTextareaElement = _this.getTextareaElement.bind(_this);
        _this.setValue = _this.setValue.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(CodeEditor, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }

                this.codeMirror = this.props.CodeMirror.fromTextArea(
                    this.getTextareaElement(),
                    this.options
                );

                this.codeMirror.on("change", function() {
                    clearTimeout(_this2.delayedOnChange);
                    _this2.delayedOnChange = setTimeout(function() {
                        _this2.props.onChange(_this2.codeMirror.getValue());
                    }, _this2.props.delay);
                });

                this.codeMirror.on("focus", function() {
                    _this2.props.onFocus();
                });

                if (this.props.height !== null) {
                    this.codeMirror.setSize(null, this.props.height);
                }

                this.setValue(this.props);
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                var _this3 = this;

                this.setValue(props);

                var checkProps = ["mode", "readOnly"];
                (0, _each3.default)(checkProps, function(prop) {
                    if (_this3.props[prop] !== props[prop]) {
                        _this3.codeMirror.setOption(prop, props[prop]);
                    }
                });
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(props, state) {
                return !(0, _isEqual3.default)(state, this.state);
            }
        },
        {
            key: "setValue",
            value: function setValue(props) {
                if (
                    this.codeMirror.getValue() !== props.value &&
                    !(0, _isNull3.default)(props.value)
                ) {
                    // the "+ ''" sort a strange with splitLines method within CodeMirror
                    this.codeMirror.setValue(props.value + "");
                    if (this.props.autoFormat) {
                        this.autoFormat();
                    }
                }
            }
        },
        {
            key: "getTextareaElement",
            value: function getTextareaElement() {
                return this.textarea;
            }
        },
        {
            key: "autoFormat",
            value: function autoFormat() {
                var totalLines = this.codeMirror.lineCount();
                this.codeMirror.autoFormatRange({ line: 0, ch: 0 }, { line: totalLines });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this4 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var props = (0, _pick3.default)(this.props, [
                    "value",
                    "onChange",
                    "onFocus",
                    "theme",
                    "mode",
                    "readOnly"
                ]);

                (0, _assign3.default)(props, {
                    ref: function ref(editor) {
                        return (_this4.editor = editor);
                    },
                    onBlur: this.props.validate,
                    className: "inputGroup",
                    placeholder: this.props.placeholder
                });

                var _props = this.props,
                    styles = _props.styles,
                    FormGroup = _props.FormGroup;

                return _react2.default.createElement(
                    FormGroup,
                    {
                        valid: this.state.isValid,
                        className: (0, _classnames2.default)(this.props.className)
                    },
                    this.props.renderLabel.call(this),
                    _react2.default.createElement(
                        "div",
                        { className: styles.wrapper },
                        _react2.default.createElement("textarea", {
                            ref: function ref(_ref) {
                                return (_this4.textarea = _ref);
                            }
                        })
                    ),
                    _react2.default.createElement(
                        "div",
                        null,
                        this.props.renderDescription.call(this),
                        this.props.renderValidationMessage.call(this)
                    )
                );
            }
        }
    ]);
    return CodeEditor;
})(_react2.default.Component);

CodeEditor.defaultProps = {
    delay: 400,
    mode: "text/html",
    theme: "monokai",
    readOnly: false, // set 'nocursor' to disable cursor
    onFocus: _noop3.default,
    value: null,
    onChange: _noop3.default,
    height: null,
    autoFormat: false
};

exports.default = (0, _webinyApp.createComponent)([CodeEditor, _webinyAppUi.FormComponent], {
    styles: _styles2.default,
    modules: ["FormGroup", { CodeMirror: "Vendor.CodeMirror" }]
});
//# sourceMappingURL=index.js.map
