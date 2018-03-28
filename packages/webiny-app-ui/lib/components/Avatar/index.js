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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Upload"], ["Upload"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["JPG, PNG, GIF"], ["JPG, PNG, GIF"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Avatar");

var Avatar = (function(_React$Component) {
    (0, _inherits3.default)(Avatar, _React$Component);

    function Avatar(props) {
        (0, _classCallCheck3.default)(this, Avatar);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Avatar.__proto__ || Object.getPrototypeOf(Avatar)).call(this, props)
        );

        _this.lastId = null;

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
            _this[m] = _this[m].bind(_this);
        });

        _this.state = Object.assign({}, props.initialState, {
            error: null,
            cropImage: null,
            actualWidth: 0,
            actualHeight: 0
        });
        return _this;
    }

    (0, _createClass3.default)(Avatar, [
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
                    if (this.props.cropper) {
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
                var _props = this.props,
                    cropper = _props.cropper,
                    Cropper = _props.Cropper;

                if (!cropper) {
                    return null;
                }

                if (cropper.inline) {
                    return _react2.default.createElement(Cropper.Inline, {
                        title: cropper.title,
                        action: cropper.action,
                        onHidden: this.onCropperHidden,
                        onCrop: this.applyCropping,
                        config: cropper.config,
                        image: this.state.cropImage
                    });
                }

                return _react2.default.createElement(Cropper.Modal, {
                    title: cropper.title,
                    action: cropper.action,
                    onHidden: this.onCropperHidden,
                    onCrop: this.applyCropping,
                    config: cropper.config,
                    image: this.state.cropImage
                });
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
            key: "render",
            value: function render() {
                var _this3 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                // If inline cropper is used - render only the cropper component
                if (
                    this.state.cropImage &&
                    (0, _get3.default)(this.props, "cropper.inline", false)
                ) {
                    return this.getCropper();
                }

                var model = this.props.value;
                var _props2 = this.props,
                    Alert = _props2.Alert,
                    Button = _props2.Button,
                    FileReader = _props2.FileReader,
                    styles = _props2.styles;

                var imageSrc = this.props.defaultImage;
                if (model) {
                    imageSrc = model.data || model.src;
                }

                var imageAction = _react2.default.createElement(
                    Button,
                    {
                        type: "primary",
                        icon: "fa-upload",
                        onClick: this.getFiles,
                        className: styles.uploadBtn
                    },
                    t(_templateObject)
                );

                var props = {
                    onDrop: this.onDrop,
                    onDragLeave: this.onDragLeave,
                    onDragOver: this.onDragOver,
                    onClick: this.getFiles,
                    className: styles.avatar
                };

                return _react2.default.createElement(
                    "div",
                    null,
                    _react2.default.createElement(
                        "div",
                        props,
                        this.state.error &&
                            _react2.default.createElement(
                                Alert,
                                { type: "error", icon: null },
                                this.state.error.message
                            ),
                        _react2.default.createElement(
                            "span",
                            { className: styles.placeholder },
                            imageSrc
                                ? _react2.default.createElement("img", {
                                      src: imageSrc,
                                      className: styles.image,
                                      height: "157",
                                      width: "157"
                                  })
                                : this.props.empty
                        ),
                        imageAction,
                        _react2.default.createElement(
                            "span",
                            { className: styles.smallText },
                            t(_templateObject2)
                        ),
                        _react2.default.createElement(FileReader, {
                            onReady: function onReady(reader) {
                                return (_this3.reader = reader);
                            },
                            sizeLimit: this.props.sizeLimit,
                            accept: this.props.accept,
                            onChange: this.fileChanged
                        }),
                        this.getCropper()
                    )
                );
            }
        }
    ]);
    return Avatar;
})(_react2.default.Component);

Avatar.defaultProps = {
    accept: ["image/jpg", "image/jpeg", "image/gif", "image/png"],
    cropper: false,
    defaultImage: null,
    empty: "x",
    sizeLimit: 2485760
};

exports.default = (0, _webinyApp.createComponent)([Avatar, _webinyAppUi.FormComponent], {
    modules: ["Alert", "FileReader", "Cropper", "Button"],
    formComponent: true,
    styles: _styles2.default
});
//# sourceMappingURL=index.js.map
