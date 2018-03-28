"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _filesize = require("filesize");

var _filesize2 = _interopRequireDefault(_filesize);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Image = (function(_React$Component) {
    (0, _inherits3.default)(Image, _React$Component);

    function Image(props) {
        (0, _classCallCheck3.default)(this, Image);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Image.__proto__ || Object.getPrototypeOf(Image)).call(this, props)
        );

        ["editImage", "deleteImage"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(Image, [
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
                this.props.onDelete();
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    Link = _props.Link,
                    image = _props.image,
                    styles = _props.styles;

                var title = image.title || image.name || "";
                var cacheBust = "";
                if (image.modifiedOn && !image.data) {
                    cacheBust = "?ts=" + new Date(image.modifiedOn).getTime();
                }

                var draggable = {
                    "data-id": this.props.index,
                    draggable: true,
                    onDragStart: this.props.onDragStart,
                    onDragEnd: this.props.onDragEnd,
                    onDragOver: this.props.onDragOver
                };

                var editBtn = null;
                if (!(0, _has3.default)(image, "progress")) {
                    editBtn = _react2.default.createElement(Link, {
                        onClick: this.editImage,
                        className: styles.fileEdit
                    });
                }

                return _react2.default.createElement(
                    "div",
                    (0, _extends3.default)({ className: styles.file }, draggable, {
                        "data-role": "image"
                    }),
                    _react2.default.createElement("img", {
                        className: styles.filePreview,
                        src: image.data || image.src + cacheBust,
                        alt: title,
                        title: title,
                        width: "133",
                        height: "133"
                    }),
                    editBtn,
                    _react2.default.createElement(Link, {
                        onClick: this.deleteImage,
                        className: styles.fileRemove
                    }),
                    _react2.default.createElement(
                        "span",
                        { className: styles.fileName },
                        image.name
                    ),
                    _react2.default.createElement(
                        "span",
                        { className: styles.fileSize },
                        image.id ? (0, _filesize2.default)(image.size) : "-"
                    )
                );
            }
        }
    ]);
    return Image;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Image, {
    modules: ["Link"],
    styles: _styles2.default
});
//# sourceMappingURL=Image.js.map
