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

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["prev"], ["prev"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["next"], ["next"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _webinyApp = require("webiny-app");

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Carousel");

var Carousel = (function(_React$Component) {
    (0, _inherits3.default)(Carousel, _React$Component);

    function Carousel(props) {
        (0, _classCallCheck3.default)(this, Carousel);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Carousel.__proto__ || Object.getPrototypeOf(Carousel)).call(this, props)
        );

        _this.carousel = null;
        _this.dom = null;

        _this.getCarouselWrapper = _this.getCarouselWrapper.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Carousel, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.initCarousel();
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps) {
                return !(0, _isEqual3.default)(this.props.children, nextProps.children);
            }
        },
        {
            key: "componentWillUpdate",
            value: function componentWillUpdate() {
                this.carousel.trigger("destroy.owl.carousel");
            }
        },
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate() {
                this.initCarousel();
            }
        },
        {
            key: "getCarouselWrapper",
            value: function getCarouselWrapper() {
                return this.dom;
            }
        },
        {
            key: "initCarousel",
            value: function initCarousel() {
                this.carousel = (0, _jquery2.default)(this.getCarouselWrapper()).owlCarousel(
                    this.props
                );
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                return _react2.default.createElement(
                    "div",
                    {
                        ref: function ref(_ref) {
                            return (_this2.dom = _ref);
                        },
                        className: (0, _classnames2.default)(
                            "owl-carousel owl-theme",
                            this.props.className
                        )
                    },
                    this.props.children
                );
            }
        }
    ]);
    return Carousel;
})(_react2.default.Component);

Carousel.defaultProps = {
    loop: true,
    margin: 10,
    nav: false,
    items: 1,
    center: false,
    autoWidth: false,
    URLhashListener: false,
    navRewind: false,
    navText: [t(_templateObject), t(_templateObject2)],
    dots: true,
    lazyLoad: false,
    autoplay: false,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    video: false,
    videoHeight: false,
    videoWidth: false,
    animateOut: false,
    animateIn: false,
    itemElement: "div",
    stageElement: "div",
    mouseDrag: false,
    className: null
};

exports.default = (0, _webinyApp.createComponent)(Carousel, {
    modules: [
        // owl.carousel attaches itself to jQuery object and does not export anything
        "Vendor.OwlCarousel"
    ]
});
//# sourceMappingURL=index.js.map
