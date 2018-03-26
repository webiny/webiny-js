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

var _styles = require("./../../Views/styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Carousel = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(Carousel, _Webiny$Ui$View);

    function Carousel() {
        (0, _classCallCheck3.default)(this, Carousel);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Carousel.__proto__ || Object.getPrototypeOf(Carousel)).apply(this, arguments)
        );
    }

    return Carousel;
})(_webinyClient.Webiny.Ui.View);

Carousel.defaultProps = {
    renderer: function renderer() {
        var Carousel = this.props.Carousel;

        return _react2.default.createElement(
            "div",
            { className: _styles2.default.carousel },
            _react2.default.createElement(
                Carousel,
                { nav: true, lazyLoad: true, items: 1, dots: true, mouseDrag: true },
                this.props.images.map(function(image) {
                    return _react2.default.createElement("img", {
                        className: "owl-lazy",
                        "data-src": image,
                        key: image
                    });
                })
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(Carousel, {
    styles: _styles2.default,
    modules: ["Carousel"]
});
//# sourceMappingURL=Carousel.js.map
