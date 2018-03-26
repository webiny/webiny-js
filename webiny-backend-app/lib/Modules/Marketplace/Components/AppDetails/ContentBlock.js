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

var _webinyClient = require("webiny-client");

var _styles = require("./../../Views/styles.css");

var _styles2 = _interopRequireDefault(_styles);

require("./../../Views/draft.scss");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ContentBlock = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(ContentBlock, _Webiny$Ui$View);

    function ContentBlock(props) {
        (0, _classCallCheck3.default)(this, ContentBlock);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ContentBlock.__proto__ || Object.getPrototypeOf(ContentBlock)).call(this, props)
        );

        _this.plugins = _this.getPlugins();
        _this.bindMethods("getPlugins");
        return _this;
    }

    (0, _createClass3.default)(ContentBlock, [
        {
            key: "getPlugins",
            value: function getPlugins() {
                var Draft = this.props.Draft;

                return [
                    new Draft.Plugins.Heading(),
                    new Draft.Plugins.Bold(),
                    new Draft.Plugins.Italic(),
                    new Draft.Plugins.Underline(),
                    new Draft.Plugins.UnorderedList(),
                    new Draft.Plugins.OrderedList(),
                    new Draft.Plugins.Alignment(),
                    new Draft.Plugins.Table(),
                    new Draft.Plugins.Link(),
                    new Draft.Plugins.Image(),
                    new Draft.Plugins.Video(),
                    new Draft.Plugins.Blockquote(),
                    new Draft.Plugins.Code(),
                    new Draft.Plugins.CodeBlock()
                ];
            }
        }
    ]);
    return ContentBlock;
})(_webinyClient.Webiny.Ui.View);

ContentBlock.defaultProps = {
    title: null,
    renderer: function renderer() {
        var _props = this.props,
            Section = _props.Section,
            Draft = _props.Draft,
            styles = _props.styles,
            title = _props.title,
            content = _props.content;

        return _react2.default.createElement(
            "content-block",
            null,
            title && _react2.default.createElement(Section, { title: title }),
            _react2.default.createElement(
                "div",
                { className: styles.description },
                _react2.default.createElement(Draft.Editor, {
                    value: content,
                    preview: true,
                    plugins: this.plugins,
                    toolbar: false
                })
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(ContentBlock, {
    styles: _styles2.default,
    modules: ["Section", "Draft"]
});
//# sourceMappingURL=ContentBlock.js.map
