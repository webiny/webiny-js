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

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ImageSet = (function(_React$Component) {
    (0, _inherits3.default)(ImageSet, _React$Component);

    function ImageSet(props) {
        (0, _classCallCheck3.default)(this, ImageSet);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ImageSet.__proto__ || Object.getPrototypeOf(ImageSet)).call(this, props)
        );

        _this.dom = null;
        _this.interval = null;
        _this.images = [];

        ["getImages, checkOffset"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(ImageSet, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.getImages();
            }
        },
        {
            key: "getImages",
            value: function getImages() {
                var _this2 = this;

                (0, _each3.default)(this.dom.querySelectorAll("img"), function(img) {
                    if (img.hasAttribute("data-src")) {
                        var rect = img.getBoundingClientRect();
                        img.setAttribute("offset", rect.top);
                        _this2.images.push(img);
                    }
                });

                if (this.images.length > 0) {
                    this.interval = setInterval(this.checkOffset, 500);
                }
            }
        },
        {
            key: "checkOffset",
            value: function checkOffset() {
                var offset = window.scrollY + window.innerHeight + this.props.offset;

                var images = [];
                this.images.map(function(img) {
                    if (offset >= img.getAttribute("offset")) {
                        img.setAttribute("src", img.getAttribute("data-src"));
                    } else {
                        images.push(img);
                    }
                });

                this.images = images;
                if (images.length <= 0) {
                    clearInterval(this.interval);
                    this.interval = null;
                }
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                var _props = this.props,
                    children = _props.children,
                    render = _props.render;

                if (render) {
                    return render.call(this);
                }

                return _react2.default.isValidElement(children)
                    ? children
                    : _react2.default.createElement(
                          "webiny-image-set",
                          {
                              ref: function ref(_ref) {
                                  return (_this3.dom = _ref);
                              }
                          },
                          children
                      );
            }
        }
    ]);
    return ImageSet;
})(_react2.default.Component);

ImageSet.defaultProps = {
    offset: 0
};

exports.default = (0, _webinyApp.createComponent)(ImageSet);
//# sourceMappingURL=ImageSet.js.map
