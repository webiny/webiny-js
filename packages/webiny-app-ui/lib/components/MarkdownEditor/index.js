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

var _isNull2 = require("lodash/isNull");

var _isNull3 = _interopRequireDefault(_isNull2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _simplemde = require("simplemde");

var _simplemde2 = _interopRequireDefault(_simplemde);

var _styles = require("./styles.scss");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var MarkdownEditor = (function(_React$Component) {
    (0, _inherits3.default)(MarkdownEditor, _React$Component);

    function MarkdownEditor(props) {
        (0, _classCallCheck3.default)(this, MarkdownEditor);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (MarkdownEditor.__proto__ || Object.getPrototypeOf(MarkdownEditor)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState);

        _this.mdEditor = null;
        _this.options = null;
        _this.textarea = null;

        ["getTextareaElement", "setValue", "getEditor", "getHtml"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(MarkdownEditor, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }

                var mdConfig = {
                    autoDownloadFontAwesome: false,
                    element: this.getTextareaElement(),
                    renderingConfig: {
                        codeSyntaxHighlighting: true
                    },
                    hideIcons: ["side-by-side", "fullscreen"],
                    indentWithTabs: true,
                    tabSize: 4
                };

                this.mdEditor = new _simplemde2.default(mdConfig);
                window.sme = this.mdEditor;

                this.mdEditor.codemirror.on("change", function() {
                    _this2.props.onChange(_this2.mdEditor.codemirror.getValue());
                });

                // Store original previewRenderer
                this.originalRenderer = this.mdEditor.options.previewRender.bind(
                    this.mdEditor.options
                );

                // Set new renderer that will use the original renderer first, then apply custom renderers
                this.mdEditor.options.previewRender = function(plainText) {
                    var html = _this2.originalRenderer(plainText);
                    (0, _each3.default)(_this2.props.customParsers, function(p) {
                        return (html = p(html));
                    });
                    return html;
                };
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                if (
                    this.mdEditor.codemirror.getValue() !== props.value &&
                    !(0, _isNull3.default)(props.value)
                ) {
                    // the "+ ''" sort a strange with splitLines method within CodeMirror
                    this.mdEditor.codemirror.setValue(props.value + "");
                }
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate() {
                return false;
            }
        },
        {
            key: "setValue",
            value: function setValue(value) {
                this.mdEditor.codemirror.setValue(value);
            }
        },
        {
            key: "getEditor",
            value: function getEditor() {
                return this.mdEditor;
            }
        },
        {
            key: "getTextareaElement",
            value: function getTextareaElement() {
                return this.textarea;
            }
        },
        {
            key: "getHtml",
            value: function getHtml() {
                return this.mdEditor.options.previewRender(this.mdEditor.codemirror.getValue());
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                return _react2.default.createElement(
                    "div",
                    { className: "smde" },
                    _react2.default.createElement("textarea", {
                        ref: function ref(_ref) {
                            return (_this3.textarea = _ref);
                        }
                    })
                );
            }
        }
    ]);
    return MarkdownEditor;
})(_react2.default.Component);

MarkdownEditor.defaultProps = {
    onChange: _noop3.default,
    customParsers: []
};

exports.default = (0, _webinyApp.createComponent)([MarkdownEditor, _webinyAppUi.FormComponent], {
    formComponent: true,
    styles: _styles2.default
});
//# sourceMappingURL=index.js.map
