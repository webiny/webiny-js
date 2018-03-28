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

var _BaseCropper2 = require("./BaseCropper");

var _BaseCropper3 = _interopRequireDefault(_BaseCropper2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var InlineCropper = (function(_BaseCropper) {
    (0, _inherits3.default)(InlineCropper, _BaseCropper);

    function InlineCropper() {
        (0, _classCallCheck3.default)(this, InlineCropper);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (InlineCropper.__proto__ || Object.getPrototypeOf(InlineCropper)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(InlineCropper, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var props = this.props;
                if (!props.image) {
                    return null;
                }

                var Button = props.Button;

                return _react2.default.createElement(
                    "webiny-image-cropper",
                    null,
                    props.children,
                    _react2.default.createElement(
                        "div",
                        { className: "col-xs-12 no-padding" },
                        _react2.default.createElement("img", {
                            onLoad: function onLoad(e) {
                                return props.initCropper(e.currentTarget);
                            },
                            width: "100%",
                            style: { maxWidth: "100%" },
                            src:
                                props.image &&
                                (props.image.data || props.image.src) + props.getCacheBust()
                        }),
                        "Cropped image size: ",
                        _react2.default.createElement(
                            "strong",
                            null,
                            props.width,
                            "x",
                            props.height
                        )
                    ),
                    _react2.default.createElement(
                        "div",
                        { className: "col-xs-12" },
                        _react2.default.createElement(
                            Button,
                            {
                                type: "primary",
                                className: "pull-right ml5",
                                onClick: this.props.applyCropping
                            },
                            this.props.action
                        ),
                        _react2.default.createElement(
                            Button,
                            {
                                type: "default",
                                className: "pull-right ml5",
                                onClick: this.props.onHidden
                            },
                            "Cancel"
                        )
                    )
                );
            }
        }
    ]);
    return InlineCropper;
})(_BaseCropper3.default);

exports.default = (0, _webinyApp.createComponent)([InlineCropper, _BaseCropper3.default], {
    modules: ["Button"]
});
//# sourceMappingURL=InlineCropper.js.map
