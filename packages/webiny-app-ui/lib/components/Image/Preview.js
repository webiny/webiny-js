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

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ImagePreview = (function(_React$Component) {
    (0, _inherits3.default)(ImagePreview, _React$Component);

    function ImagePreview(props) {
        (0, _classCallCheck3.default)(this, ImagePreview);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ImagePreview.__proto__ || Object.getPrototypeOf(ImagePreview)).call(this, props)
        );

        ["editImage", "deleteImage"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(ImagePreview, [
        {
            key: "editImage",
            value: function editImage(e) {
                e.stopPropagation();
                this.props.onEdit();
            }
        },
        {
            key: "deleteImage",
            value: function deleteImage(e) {
                e.stopPropagation();
                this.props.onDelete(e);
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    image = _props.image,
                    Link = _props.Link,
                    styles = _props.styles;

                var cacheBust = "";
                if (image.modifiedOn && !image.data) {
                    cacheBust = "?ts=" + new Date(image.modifiedOn).getTime();
                }

                return _react2.default.createElement(
                    "div",
                    { className: styles.file, style: { float: "none" } },
                    _react2.default.createElement("img", {
                        className: styles.filePreview,
                        src: image.data || image.src + cacheBust,
                        style: { width: "100%" }
                    }),
                    this.props.onEdit
                        ? _react2.default.createElement(Link, {
                              onClick: this.editImage,
                              className: styles.fileEdit
                          })
                        : null,
                    _react2.default.createElement(Link, {
                        onClick: this.deleteImage,
                        className: styles.fileRemove
                    })
                );
            }
        }
    ]);
    return ImagePreview;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(ImagePreview, {
    modules: ["Link"],
    styles: _styles2.default
});
//# sourceMappingURL=Preview.js.map
