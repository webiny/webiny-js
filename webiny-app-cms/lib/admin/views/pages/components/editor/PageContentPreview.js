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

var _cloneDeep2 = require("lodash/cloneDeep");

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _webinyApp = require("webiny-app");

var _blankStateBalloon = require("./assets/blank-state-balloon.jpg");

var _blankStateBalloon2 = _interopRequireDefault(_blankStateBalloon);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var PageContentPreview = (function(_React$Component) {
    (0, _inherits3.default)(PageContentPreview, _React$Component);

    function PageContentPreview() {
        (0, _classCallCheck3.default)(this, PageContentPreview);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (PageContentPreview.__proto__ || Object.getPrototypeOf(PageContentPreview)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(PageContentPreview, [
        {
            key: "renderPreviewWidget",
            value: function renderPreviewWidget(widget) {
                var cms = this.props.services.cms;

                var widgetData = cms.getWidget(widget.type);
                (0, _invariant2.default)(
                    widgetData,
                    'Missing widget definition for type "' + widget.type + '"'
                );

                if (widget.origin) {
                    var wd = cms.getEditorWidget(widget.type, { origin: widget.origin });
                    if (!widget.data) {
                        widget.data = (0, _cloneDeep3.default)(wd.data);
                    }

                    if (!widget.settings) {
                        widget.settings = (0, _cloneDeep3.default)(wd.settings);
                    }
                }

                return _react2.default.createElement(
                    "div",
                    { key: widget.id },
                    _react2.default.cloneElement(widgetData.widget.render(widget), {
                        widget: widget
                    })
                );
            }
        },
        {
            key: "render",
            value: function render() {
                var styles = this.props.styles;

                return _react2.default.createElement(
                    _react2.default.Fragment,
                    null,
                    !this.props.content.length &&
                        _react2.default.createElement(
                            "div",
                            { className: styles.emptyPlaceholder },
                            _react2.default.createElement(
                                "div",
                                { className: styles.emptyContent },
                                _react2.default.createElement("img", {
                                    src: _blankStateBalloon2.default,
                                    alt: ""
                                }),
                                _react2.default.createElement(
                                    "h3",
                                    null,
                                    "This revision seems to be empty!"
                                )
                            )
                        ),
                    this.props.content.length > 0 &&
                        this.props.content.map(this.renderPreviewWidget.bind(this))
                );
            }
        }
    ]);
    return PageContentPreview;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(PageContentPreview, { services: ["cms"] });
//# sourceMappingURL=PageContentPreview.js.map
