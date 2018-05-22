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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyCompose = require("webiny-compose");

var _webinyCompose2 = _interopRequireDefault(_webinyCompose);

var _webinyApp = require("webiny-app");

var _webinyAppCms = require("webiny-app-cms");

var _widget = require("./widget");

var _widget2 = _interopRequireDefault(_widget);

var _settings = require("./settings");

var _settings2 = _interopRequireDefault(_settings);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ImageWidget = (function(_EditorWidget) {
    (0, _inherits3.default)(ImageWidget, _EditorWidget);

    function ImageWidget() {
        (0, _classCallCheck3.default)(this, ImageWidget);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ImageWidget.__proto__ || Object.getPrototypeOf(ImageWidget)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(ImageWidget, [
        {
            key: "removeWidget",
            value: function removeWidget(_ref) {
                var widget = _ref.widget;

                if (widget.data.image) {
                    return this.deleteImage(widget.data.image.id);
                }
            }
        },
        {
            key: "renderWidget",
            value: function renderWidget(_ref2) {
                var EditorWidget = _ref2.EditorWidget;

                return _react2.default.createElement(
                    EditorWidget,
                    null,
                    _react2.default.createElement(_widget2.default, {
                        handleImage: this.handleImage.bind(this)
                    })
                );
            }
        },
        {
            key: "renderSettings",
            value: function renderSettings(_ref3) {
                var EditorWidgetSettings = _ref3.EditorWidgetSettings;

                return _react2.default.createElement(
                    EditorWidgetSettings,
                    null,
                    _react2.default.createElement(_settings2.default, null)
                );
            }

            /**
             * @private
             * @param id
             * @returns {*}
             */
        },
        {
            key: "deleteImage",
            value: function deleteImage(id) {
                var deleteImage = _webinyApp.app.graphql.generateDelete("Image");
                return deleteImage({ variables: { id: id } });
            }

            /**
             * @private
             * @param props
             * @param value
             * @param onChange
             */
        },
        {
            key: "handleImage",
            value: function handleImage(props, value, onChange) {
                var _this2 = this;

                var fields = "id src width height";

                var flow = [
                    // Delete if image is removed
                    function(_ref4, next, finish) {
                        var value = _ref4.value,
                            oldValue = _ref4.oldValue;

                        if (!value) {
                            if (oldValue.id) {
                                return _this2.deleteImage(oldValue.id).then(function() {
                                    return finish({ value: null });
                                });
                            }
                        }
                        next();
                    },
                    // Update if new image is selected
                    function(_ref5, next, finish) {
                        var value = _ref5.value,
                            oldValue = _ref5.oldValue;

                        if (value && oldValue) {
                            var update = _webinyApp.app.graphql.generateUpdate("Image", fields);
                            return update({ variables: { id: oldValue.id, data: value } }).then(
                                function(_ref6) {
                                    var data = _ref6.data;
                                    return finish({ value: data });
                                }
                            );
                        }
                        next();
                    },
                    // Insert new image
                    function(_ref7, next, finish) {
                        var value = _ref7.value;

                        var create = _webinyApp.app.graphql.generateCreate("Image", fields);
                        create({ variables: { data: value } }).then(function(_ref8) {
                            var data = _ref8.data;
                            return finish({ value: data });
                        });
                    }
                ];

                (0, _webinyCompose2.default)(flow)({
                    value: value,
                    oldValue: (0, _get3.default)(props.widget, "data.image")
                }).then(function(_ref9) {
                    var value = _ref9.value;
                    return onChange(value);
                });
            }
        }
    ]);
    return ImageWidget;
})(_webinyAppCms.EditorWidget);

exports.default = ImageWidget;
//# sourceMappingURL=index.js.map
