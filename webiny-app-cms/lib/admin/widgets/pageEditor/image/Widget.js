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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ImageWidget = (function(_React$Component) {
    (0, _inherits3.default)(ImageWidget, _React$Component);

    function ImageWidget() {
        (0, _classCallCheck3.default)(this, ImageWidget);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ImageWidget.__proto__ || Object.getPrototypeOf(ImageWidget)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(ImageWidget, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    _props$modules = _props.modules,
                    Image = _props$modules.Image,
                    Input = _props$modules.Input,
                    ChangeConfirm = _props$modules.ChangeConfirm,
                    Bind = _props.Bind,
                    handleImage = _props.handleImage,
                    isGlobal = _props.isGlobal;

                return _react2.default.createElement(
                    _react2.default.Fragment,
                    null,
                    _react2.default.createElement(
                        ChangeConfirm,
                        {
                            title: "Be careful!",
                            confirm: "I'm aware of what I am doing!",
                            cancel: "Maybe later",
                            message: _react2.default.createElement(
                                "span",
                                null,
                                "You are about to remove an image from a global widget.",
                                _react2.default.createElement("br", null),
                                "All the content that is currently using this widget will be affected!"
                            )
                        },
                        function(_ref) {
                            var showConfirmation = _ref.showConfirmation;
                            return _react2.default.createElement(
                                Bind,
                                {
                                    beforeChange: function beforeChange(value, onChange) {
                                        if (isGlobal) {
                                            return showConfirmation(value, function(value) {
                                                handleImage(_this2.props, value, onChange);
                                            });
                                        }
                                        handleImage(_this2.props, value, onChange);
                                    }
                                },
                                _react2.default.createElement(Image, {
                                    name: "image",
                                    sizeLimit: 10000000,
                                    cropper: {
                                        title: "Crop your image",
                                        action: "Save image",
                                        config: {
                                            closeOnClick: false
                                        }
                                    }
                                })
                            );
                        }
                    ),
                    _react2.default.createElement(
                        Bind,
                        null,
                        _react2.default.createElement(Input, {
                            placeholder: "Image caption",
                            name: "caption"
                        })
                    )
                );
            }
        }
    ]);
    return ImageWidget;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(ImageWidget, {
    modules: ["Image", "Input", "ChangeConfirm"]
});
//# sourceMappingURL=Widget.js.map
