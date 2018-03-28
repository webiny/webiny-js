"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["DRAG FILES HERE"],
        ["DRAG FILES HERE"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Dragging not convenient?"],
        ["Dragging not convenient?"]
    ),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(
        ["SELECT FILES HERE"],
        ["SELECT FILES HERE"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _Preview = require("./Preview");

var _Preview2 = _interopRequireDefault(_Preview);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Image");

var Image = (function(_React$Component) {
    (0, _inherits3.default)(Image, _React$Component);

    function Image(props) {
        (0, _classCallCheck3.default)(this, Image);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Image.__proto__ || Object.getPrototypeOf(Image)).call(this, props)
        );

        _this.lastId = null;

        _this.state = Object.assign({}, props.initialState, {
            error: null,
            cropImage: null,
            actualWidth: 0,
            actualHeight: 0
        });

        [
            "applyCropping",
            "onCropperHidden",
            "fileChanged",
            "editFile",
            "removeFile",
            "getFiles",
            "getCropper",
            "onDrop",
            "onDragOver",
            "onDragLeave"
        ].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(Image, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }
            }
        },
        {
            key: "applyCropping",
            value: function applyCropping(newImage) {
                var _this2 = this;

                this.props.onChange(newImage).then(function() {
                    return _this2.setState({ cropImage: null });
                });
            }
        },
        {
            key: "onCropperHidden",
            value: function onCropperHidden() {
                this.setState({ cropImage: null });
            }
        },
        {
            key: "fileChanged",
            value: function fileChanged(file, error) {
                if (error) {
                    this.setState({ error: error });
                    return;
                }

                if ((0, _has3.default)(file, "data")) {
                    file.id = (0, _get3.default)(this.props, "value.id", this.lastId);
                    if (this.props.cropper && file.type !== "image/svg+xml") {
                        this.setState({ cropImage: file });
                    } else {
                        this.props.onChange(file);
                    }
                }
            }
        },
        {
            key: "editFile",
            value: function editFile() {
                this.setState({
                    cropImage: this.props.value
                });
            }
        },
        {
            key: "removeFile",
            value: function removeFile(e) {
                if (e && e.stopPropagation) {
                    e.stopPropagation();
                }
                this.lastId = (this.props.value && this.props.value.id) || null;
                this.props.onChange(null);
            }
        },
        {
            key: "getFiles",
            value: function getFiles(e) {
                this.setState({ error: null });
                if (e && e.stopPropagation) {
                    e.stopPropagation();
                }
                this.reader.getFiles();
            }
        },
        {
            key: "getCropper",
            value: function getCropper() {
                var children =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var _props = this.props,
                    cropper = _props.cropper,
                    Cropper = _props.Cropper;

                if (!cropper) {
                    return null;
                }

                if (cropper.inline) {
                    return _react2.default.createElement(
                        Cropper.Inline,
                        {
                            title: cropper.title,
                            action: cropper.action,
                            onHidden: this.onCropperHidden,
                            onCrop: this.applyCropping,
                            config: cropper.config,
                            image: this.state.cropImage
                        },
                        children
                    );
                }

                return _react2.default.createElement(
                    Cropper.Modal,
                    {
                        title: cropper.title,
                        action: cropper.action,
                        onHidden: this.onCropperHidden,
                        onCrop: this.applyCropping,
                        config: cropper.config,
                        image: this.state.cropImage
                    },
                    children
                );
            }
        },
        {
            key: "onDragOver",
            value: function onDragOver(e) {
                e.preventDefault();
                this.setState({
                    dragOver: true
                });
            }
        },
        {
            key: "onDragLeave",
            value: function onDragLeave() {
                this.setState({
                    dragOver: false
                });
            }
        },
        {
            key: "onDrop",
            value: function onDrop(evt) {
                evt.preventDefault();
                evt.persist();

                this.setState({
                    dragOver: false
                });

                this.reader.readFiles(evt.dataTransfer.files);
            }
        },
        {
            key: "renderError",
            value: function renderError() {
                var error = null;
                if (this.state.error) {
                    var Alert = this.props.Alert;

                    error = _react2.default.createElement(
                        Alert,
                        { type: "error" },
                        this.state.error.message
                    );
                }
                return error;
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (
                    this.state.cropImage &&
                    (0, _get3.default)(this.props, "cropper.inline", false)
                ) {
                    return this.getCropper();
                }

                var _props2 = this.props,
                    FileReader = _props2.FileReader,
                    FormGroup = _props2.FormGroup,
                    styles = _props2.styles;

                var message = null;
                if (!this.props.value) {
                    message = _react2.default.createElement(
                        "div",
                        null,
                        _react2.default.createElement(
                            "span",
                            { className: styles.mainText },
                            t(_templateObject)
                        )
                    );
                }

                var props = {
                    onDrop: this.onDrop,
                    onDragLeave: this.onDragLeave,
                    onDragOver: this.onDragOver,
                    onClick: this.getFiles
                };

                var css = (0, _classnames2.default)(styles.trayBin, styles.trayBinEmpty);

                if (this.props.value) {
                    css = (0, _classnames2.default)(styles.trayBin);
                }

                var image = null;
                if (this.props.value) {
                    var imageProps = {
                        image: this.props.value,
                        onEdit: this.props.cropper ? this.editFile : null,
                        onDelete: this.removeFile,
                        onDragStart: this.onImageDragStart,
                        onDragEnd: this.onImageDragEnd,
                        onDragOver: this.onImageDragOver
                    };

                    image = _react2.default.createElement(_Preview2.default, imageProps);
                }

                return _react2.default.createElement(
                    FormGroup,
                    { className: this.props.className },
                    _react2.default.createElement(
                        "div",
                        (0, _extends3.default)(
                            { className: (0, _classnames2.default)(css) },
                            props
                        ),
                        this.renderError(),
                        _react2.default.createElement(
                            "div",
                            { className: styles.container },
                            message,
                            image,
                            _react2.default.createElement(FileReader, {
                                onReady: function onReady(reader) {
                                    return (_this3.reader = reader);
                                },
                                accept: this.props.accept,
                                sizeLimit: this.props.sizeLimit,
                                onChange: this.fileChanged
                            })
                        ),
                        _react2.default.createElement(
                            "div",
                            { className: styles.uploadAction },
                            _react2.default.createElement("span", null, t(_templateObject2)),
                            "\xA0",
                            _react2.default.createElement(
                                "a",
                                { href: "#", onClick: this.getFiles },
                                t(_templateObject3)
                            )
                        )
                    ),
                    this.getCropper()
                );
            }
        }
    ]);
    return Image;
})(_react2.default.Component);

Image.defaultProps = {
    accept: ["image/jpg", "image/jpeg", "image/gif", "image/png"],
    cropper: false,
    sizeLimit: 2485760
};

exports.default = (0, _webinyApp.createComponent)([Image, _webinyAppUi.FormComponent], {
    modules: ["FileReader", "Alert", "Cropper", "FormGroup"],
    formComponent: true,
    styles: _styles2.default
});
//# sourceMappingURL=index.js.map
