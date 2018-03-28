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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _set2 = require("lodash/set");

var _set3 = _interopRequireDefault(_set2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["DRAG FILES HERE"],
        ["DRAG FILES HERE"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Some files could not be added to the gallery"],
        ["Some files could not be added to the gallery"]
    ),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(["Title"], ["Title"]),
    _templateObject4 = (0, _taggedTemplateLiteral3.default)(
        ["Type in an image title"],
        ["Type in an image title"]
    ),
    _templateObject5 = (0, _taggedTemplateLiteral3.default)(
        ["Dragging not convenient?"],
        ["Dragging not convenient?"]
    ),
    _templateObject6 = (0, _taggedTemplateLiteral3.default)(
        ["SELECT FILES HERE"],
        ["SELECT FILES HERE"]
    ),
    _templateObject7 = (0, _taggedTemplateLiteral3.default)(
        ["Maximum number of images reached!"],
        ["Maximum number of images reached!"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _Image = require("./Image");

var _Image2 = _interopRequireDefault(_Image);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var placeholder = document.createElement("div");
placeholder.className = _styles2.default.placeholder;
placeholder.textContent = "Drop here";

var t = _webinyApp.i18n.namespace("Webiny.Ui.Gallery");

var Gallery = (function(_React$Component) {
    (0, _inherits3.default)(Gallery, _React$Component);

    function Gallery(props) {
        (0, _classCallCheck3.default)(this, Gallery);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Gallery.__proto__ || Object.getPrototypeOf(Gallery)).call(this, props)
        );

        _this.lastId = null;
        _this.dragged = null;

        _this.state = Object.assign({}, props.initialState, {
            cropImage: null,
            actualWidth: 0,
            actualHeight: 0,
            images: [],
            dragOver: false,
            errors: null
        });

        [
            "getFiles",
            "getImageIndex",
            "getCropper",
            "saveImage",
            "deleteImage",
            "applyCropping",
            "onCropperHidden",
            "filesChanged",
            "onDrop",
            "onDragOver",
            "onDragLeave",
            "onImageDragOver",
            "onImageDragStart",
            "onImageDragEnd"
        ].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(Gallery, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }

                this.setupComponent(this.props);
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                this.setupComponent(props);
            }
        },
        {
            key: "setupComponent",
            value: function setupComponent(props) {
                // TODO: @i18nRefactor ESLint Do not use findDOMNode (react/no-find-dom-node)
                this.dom = _reactDom2.default.findDOMNode(this); // eslint-disable-line
                if (props.value) {
                    var images = props.value.map(function(img) {
                        img.key = (0, _uniqueId3.default)("image-");
                        return img;
                    });
                    this.setState({ images: images });
                }
            }
        },
        {
            key: "bindTo",
            value: function bindTo(key) {
                return new _webinyAppUi.LinkState(this, key).create();
            }
        },
        {
            key: "getImageIndex",
            value: function getImageIndex(image) {
                var index = null;
                this.state.images.map(function(stateImage, stateIndex) {
                    if (stateImage.key === image.key) {
                        index = stateIndex;
                    }
                });
                return index;
            }
        },
        {
            key: "saveImage",
            value: function saveImage(image) {
                var numberOfImages = (0, _get3.default)(this.props, "value.length", 0) + 1;
                // Show error message if maximum images limit is reached and the image being saved does not yet exists in the gallery
                if (
                    this.props.maxImages &&
                    numberOfImages > this.props.maxImages &&
                    !(0, _find3.default)(this.props.value, { name: image.name })
                ) {
                    var errors = this.state.errors || [];
                    errors.push({ name: image.name, message: this.props.maxImagesMessage });
                    this.setState({ errors: errors });
                    return;
                }

                var index = this.getImageIndex(image);
                var state = this.state;
                if (index !== null) {
                    (0, _set3.default)(state, "images." + index, image);
                } else {
                    image.order = state.images.length;
                    state.images.push(image);
                }
                this.props.onChange(state.images);
                this.props.onSaveImage({ image: image });
            }
        },
        {
            key: "applyCropping",
            value: function applyCropping(newImage) {
                var _this2 = this;

                this.setState({ cropImage: null }, function() {
                    _this2.saveImage(newImage);
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
            key: "filesChanged",
            value: function filesChanged(files, errors) {
                var _this3 = this;

                if (errors && errors.length) {
                    this.setState({ errors: errors });
                } else {
                    this.setState({ errors: null });
                }

                if (files.length === 1) {
                    var file = files[0];
                    file.key = (0, _uniqueId3.default)("image-");
                    if (this.props.newCropper) {
                        return this.setState({ cropImage: file });
                    }

                    return this.setState({ cropImage: null }, function() {
                        _this3.saveImage(file);
                    });
                }

                files.map(function(img) {
                    img.key = (0, _uniqueId3.default)("image-");
                    _this3.saveImage(img);
                });
            }
        },
        {
            key: "getFiles",
            value: function getFiles(e) {
                e.stopPropagation();
                this.reader.getFiles();
            }
        },
        {
            key: "onDragOver",
            value: function onDragOver(e) {
                if (this.dragged) {
                    return;
                }

                e.preventDefault();
                this.setState({
                    dragOver: true
                });
            }
        },
        {
            key: "onDragLeave",
            value: function onDragLeave() {
                if (this.dragged) {
                    return;
                }

                this.setState({
                    dragOver: false
                });
            }
        },
        {
            key: "onDrop",
            value: function onDrop(e) {
                if (this.dragged) {
                    e.preventDefault();
                    return;
                }

                e.preventDefault();
                e.persist();

                this.setState({
                    dragOver: false
                });

                this.reader.readFiles(e.dataTransfer.files);
            }
        },
        {
            key: "editImage",
            value: function editImage(image, index) {
                this.setState({ cropImage: image, cropIndex: index });
            }
        },
        {
            key: "deleteImage",
            value: function deleteImage(image, index) {
                var state = this.state;
                state.images.splice(index, 1);
                state.images = state.images.map(function(item, i) {
                    item.order = i;
                    return item;
                });
                this.props.onChange(state.images);
            }
        },
        {
            key: "onImageDragStart",
            value: function onImageDragStart(e) {
                this.dragged = (0, _jquery2.default)(e.currentTarget).closest(
                    '[data-role="image"]'
                )[0];
                if (this.dragged) {
                    e.dataTransfer.setDragImage(this.dragged, 10, 50);
                    // Firefox requires calling dataTransfer.setData for the drag to properly work
                    e.dataTransfer.setData("text/html", this.dragged);
                }
            }
        },
        {
            key: "onImageDragEnd",
            value: function onImageDragEnd(e) {
                e.preventDefault();
                if (!this.dragged) {
                    return;
                }
                // Update state
                var data = this.state.images;
                var from = Number(this.dragged.dataset.id);
                var to = Number(this.over.dataset.id);
                if (from < to) {
                    to--;
                }
                if (this.nodePlacement === "after") {
                    to++;
                }

                this.dragged.style.display = "inline-block";
                if (this.dragged.parentNode === placeholder.parentNode) {
                    this.dragged.parentNode.removeChild(placeholder);
                }
                this.dragged = null;

                data.splice(to, 0, data.splice(from, 1)[0]);
                data = data.map(function(item, index) {
                    item.order = index;
                    return item;
                });
                this.props.onChange(data);
            }
        },
        {
            key: "onImageDragOver",
            value: function onImageDragOver(e) {
                if (!this.dragged) {
                    return;
                }
                e.preventDefault();
                this.dragged.style.display = "none";
                var over = (0, _jquery2.default)(e.target).closest('[data-role="image"]')[0];
                if (!over || (0, _jquery2.default)(over).hasClass("placeholder")) {
                    return;
                }
                this.over = over;

                // Inside the dragOver method
                var relX = e.clientX - (0, _jquery2.default)(over).offset().left;
                var width = over.offsetWidth / 2;
                var parent = over.parentNode;

                if (relX > width) {
                    this.nodePlacement = "after";
                    parent.insertBefore(placeholder, over.nextElementSibling);
                } else if (relX < width) {
                    this.nodePlacement = "before";
                    parent.insertBefore(placeholder, over);
                }
            }
        },
        {
            key: "getCropper",
            value: function getCropper() {
                var children =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                var cropper = this.props.newCropper;
                if (this.state.cropImage && this.state.cropImage.id) {
                    cropper = this.props.editCropper;
                }

                if (!cropper) {
                    return null;
                }

                var Cropper = this.props.Cropper;

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
            key: "render",
            value: function render() {
                var _this4 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    FileReader = _props.FileReader,
                    Alert = _props.Alert,
                    Input = _props.Input,
                    FormGroup = _props.FormGroup,
                    styles = _props.styles;

                var message = null;
                if (this.state.images.length === 0) {
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

                if (this.state.images.length > 0) {
                    css = (0, _classnames2.default)(styles.trayBin);
                }

                var errors = null;
                if (this.state.errors) {
                    var data = [];
                    (0, _each3.default)(this.state.errors, function(err, key) {
                        data.push(
                            _react2.default.createElement(
                                "li",
                                { key: key },
                                _react2.default.createElement("strong", null, err.name),
                                ": ",
                                err.message
                            )
                        );
                    });

                    errors = _react2.default.createElement(
                        Alert,
                        { title: t(_templateObject2), type: "error" },
                        data && _react2.default.createElement("ul", null, data)
                    );
                }

                return _react2.default.createElement(
                    FormGroup,
                    null,
                    _react2.default.createElement(
                        "div",
                        { className: css },
                        errors,
                        _react2.default.createElement(
                            "div",
                            (0, _extends3.default)({ className: styles.container }, props),
                            message,
                            this.state.images.map(function(item, index) {
                                var imageProps = {
                                    key: item.id || index,
                                    index: index,
                                    image: item,
                                    onEdit: function onEdit() {
                                        return _this4.editImage(item, index);
                                    },
                                    onDelete: function onDelete() {
                                        _this4.deleteImage(item, index);
                                    },
                                    onDragStart: _this4.onImageDragStart,
                                    onDragEnd: _this4.onImageDragEnd,
                                    onDragOver: _this4.onImageDragOver
                                };

                                // eslint-disable-next-line
                                return _react2.default.createElement(_Image2.default, imageProps);
                            }),
                            _react2.default.createElement(FileReader, {
                                accept: this.props.accept,
                                multiple: true,
                                onReady: function onReady(reader) {
                                    return (_this4.reader = reader);
                                },
                                sizeLimit: this.props.sizeLimit,
                                onChange: this.filesChanged
                            }),
                            this.getCropper(
                                _react2.default.createElement(
                                    Input,
                                    (0, _extends3.default)(
                                        {
                                            label: t(_templateObject3),
                                            placeholder: t(_templateObject4)
                                        },
                                        this.bindTo("cropImage.title")
                                    )
                                )
                            )
                        ),
                        _react2.default.createElement(
                            "div",
                            { className: styles.uploadAction },
                            _react2.default.createElement("span", null, t(_templateObject5)),
                            "\xA0",
                            _react2.default.createElement(
                                "a",
                                { href: "#", onClick: this.getFiles },
                                t(_templateObject6)
                            )
                        )
                    )
                );
            }
        }
    ]);
    return Gallery;
})(_react2.default.Component);

Gallery.defaultProps = {
    accept: ["image/jpg", "image/jpeg", "image/gif", "image/png"],
    sizeLimit: 10000000,
    maxImages: null,
    maxImagesMessage: t(_templateObject7),
    newCropper: {},
    editCropper: {},
    onSaveImage: _noop3.default
};

Gallery.Image = _Image2.default;

exports.default = (0, _webinyApp.createComponent)([Gallery, _webinyAppUi.FormComponent], {
    modules: ["Alert", "Cropper", "FileReader", "Input", "FormGroup"],
    styles: _styles2.default,
    formComponent: true
});
//# sourceMappingURL=index.js.map
