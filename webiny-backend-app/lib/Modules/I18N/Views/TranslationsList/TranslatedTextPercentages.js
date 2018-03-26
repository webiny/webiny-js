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

var _TranslatedTextPercentages = require("./TranslatedTextPercentages.scss");

var _TranslatedTextPercentages2 = _interopRequireDefault(_TranslatedTextPercentages);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.I18n.TranslationsList.TranslatedTextPercentages
 */
var TranslatedTextPercentages = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(TranslatedTextPercentages, _Webiny$Ui$Component);

    function TranslatedTextPercentages() {
        (0, _classCallCheck3.default)(this, TranslatedTextPercentages);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (
                TranslatedTextPercentages.__proto__ ||
                Object.getPrototypeOf(TranslatedTextPercentages)
            ).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(TranslatedTextPercentages, [
        {
            key: "renderProgressBar",
            value: function renderProgressBar(locale, data) {
                var label = this.i18n("N/A");
                var percentage = 0;
                if (data.texts.total) {
                    percentage = (locale.count / data.texts.total * 100).toFixed(0);
                    label = locale.count + " / " + data.texts.total + " (" + percentage + "%)";
                }

                return _react2.default.createElement(
                    "progress-bar",
                    null,
                    _react2.default.createElement("bar", { style: { width: percentage + "%" } }),
                    _react2.default.createElement("label", null, label)
                );
            }
        }
    ]);
    return TranslatedTextPercentages;
})(_webinyClient.Webiny.Ui.Component);

TranslatedTextPercentages.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        var Ui = this.props.Ui;

        return _react2.default.createElement(
            "div",
            { className: _TranslatedTextPercentages2.default.translatedTextPercentages },
            _react2.default.createElement(Ui.Section, { title: this.i18n("Translations") }),
            _react2.default.createElement(
                Ui.Data,
                { api: "/entities/webiny/i18n-texts/stats/translated" },
                function(_ref) {
                    var data = _ref.data;
                    return _react2.default.createElement(
                        Ui.Grid.Row,
                        null,
                        data.translations.map(function(item) {
                            return _react2.default.createElement(
                                Ui.Grid.Col,
                                {
                                    key: item.locale.key,
                                    className:
                                        _TranslatedTextPercentages2.default
                                            .translatedTextPercentagesLocaleStats,
                                    xs: "12",
                                    sm: "6",
                                    md: "4",
                                    lg: "3"
                                },
                                _react2.default.createElement("strong", null, item.locale.label),
                                _this2.renderProgressBar(item, data)
                            );
                        })
                    );
                }
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(TranslatedTextPercentages, {
    modulesProp: "Ui",
    modules: ["Data", "Grid", "Section"]
});
//# sourceMappingURL=TranslatedTextPercentages.js.map
