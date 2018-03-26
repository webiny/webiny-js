"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _TextRow = require("./TextRow.scss");

var _TextRow2 = _interopRequireDefault(_TextRow);

var _EditableTranslation = require("./TranslationListRow/EditableTranslation");

var _EditableTranslation2 = _interopRequireDefault(_EditableTranslation);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var TextRow = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(TextRow, _Webiny$Ui$Component);

    function TextRow() {
        (0, _classCallCheck3.default)(this, TextRow);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (TextRow.__proto__ || Object.getPrototypeOf(TextRow)).apply(this, arguments)
        );
    }

    return TextRow;
})(_webinyClient.Webiny.Ui.Component);

TextRow.defaultProps = {
    text: null,
    locales: [],
    renderer: function renderer() {
        var _props = this.props,
            Ui = _props.Ui,
            text = _props.text;

        return _react2.default.createElement(
            "div",
            { className: _TextRow2.default.translationListRow },
            _react2.default.createElement(
                "div",
                { onClick: this.toggle },
                _react2.default.createElement(
                    "div",
                    null,
                    _react2.default.createElement("h1", { className: "base" }, text.base),
                    _react2.default.createElement("code", { className: "key" }, text.key)
                ),
                _react2.default.createElement(
                    "translations",
                    null,
                    _react2.default.createElement(
                        "ul",
                        null,
                        this.props.locales.map(function(locale) {
                            var translation = _lodash2.default.find(text.translations, {
                                locale: locale.key
                            });
                            return _react2.default.createElement(
                                "li",
                                { key: _lodash2.default.uniqueId() },
                                _react2.default.createElement(_EditableTranslation2.default, {
                                    locale: locale,
                                    text: text,
                                    translation: translation
                                })
                            );
                        })
                    )
                )
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(TextRow, {
    modulesProp: "Ui",
    modules: ["Modal", "Form", "Grid", "Input", "Textarea", "Button", "Select", "Section", "Input"]
});
//# sourceMappingURL=TextRow.js.map
