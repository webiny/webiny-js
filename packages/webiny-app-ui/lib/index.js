"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.app = exports.OptionComponent = exports.LinkState = exports.FormComponent = exports.ModalConfirmationComponent = exports.ModalComponent = undefined;

var _ModalComponent = require("./components/Modal/Components/ModalComponent");

Object.defineProperty(exports, "ModalComponent", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_ModalComponent).default;
    }
});

var _ModalConfirmationComponent = require("./components/Modal/Components/ModalConfirmationComponent");

Object.defineProperty(exports, "ModalConfirmationComponent", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_ModalConfirmationComponent).default;
    }
});

var _FormComponent = require("./components/Form/FormComponent");

Object.defineProperty(exports, "FormComponent", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_FormComponent).default;
    }
});

var _LinkState = require("./components/Form/LinkState");

Object.defineProperty(exports, "LinkState", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_LinkState).default;
    }
});

var _OptionComponent = require("./components/Option/OptionComponent");

Object.defineProperty(exports, "OptionComponent", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_OptionComponent).default;
    }
});

require("./assets/styles.scss");

var _growler = require("./services/growler");

var _growler2 = _interopRequireDefault(_growler);

var _modal = require("./services/modal");

var _modal2 = _interopRequireDefault(_modal);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

if (window) {
    window.jQuery = window.$ = require("jquery");
}

require("bootstrap-sass");

var app = function app() {
    return function(_ref, next) {
        var app = _ref.app;

        app.services.add("growler", function() {
            return _growler2.default;
        });
        app.services.add("modal", function() {
            return new _modal2.default();
        });

        app.modules.register([
            {
                name: "Alert",
                factory: function factory() {
                    return import("./components/Alert");
                }
            },
            {
                name: "Animate",
                factory: function factory() {
                    return import("./components/Animate");
                }
            },
            {
                name: "Avatar",
                factory: function factory() {
                    return import("./components/Avatar");
                }
            },
            {
                name: "Button",
                factory: function factory() {
                    return import("./components/Button");
                }
            },
            {
                name: "ButtonGroup",
                factory: function factory() {
                    return import("./components/ButtonGroup");
                }
            },
            {
                name: "Carousel",
                factory: function factory() {
                    return import("./components/Carousel");
                }
            },
            {
                name: "ChangeConfirm",
                factory: function factory() {
                    return import("./components/ChangeConfirm");
                }
            },
            {
                name: "Checkbox",
                factory: function factory() {
                    return import("./components/Checkbox");
                }
            },
            {
                name: "CheckboxGroup",
                factory: function factory() {
                    return import("./components/CheckboxGroup");
                }
            },
            {
                name: "ClickConfirm",
                factory: function factory() {
                    return import("./components/ClickConfirm");
                }
            },
            {
                name: "ClickSuccess",
                factory: function factory() {
                    return import("./components/ClickSuccess");
                }
            },
            {
                name: "CodeEditor",
                factory: function factory() {
                    return import("./components/CodeEditor");
                }
            },
            {
                name: "CodeHighlight",
                factory: function factory() {
                    return import("./components/CodeHighlight");
                }
            },
            {
                name: "Copy",
                factory: function factory() {
                    return import("./components/Copy");
                }
            },
            {
                name: "Cropper",
                factory: function factory() {
                    return import("./components/Cropper");
                }
            },
            {
                name: "Data",
                factory: function factory() {
                    return import("./components/Data");
                }
            },
            {
                name: "DelayedOnChange",
                factory: function factory() {
                    return import("./components/DelayedOnChange");
                }
            },
            {
                name: "Downloader",
                factory: function factory() {
                    return import("./components/Downloader");
                }
            },
            {
                name: "DownloadLink",
                factory: function factory() {
                    return import("./components/DownloadLink");
                }
            },
            {
                name: "Dropdown",
                factory: function factory() {
                    return import("./components/Dropdown");
                }
            },
            {
                name: "Dynamic",
                factory: function factory() {
                    return import("./components/Dynamic");
                }
            },
            {
                name: "Email",
                factory: function factory() {
                    return import("./components/Email");
                }
            },
            {
                name: "File",
                factory: function factory() {
                    return import("./components/File");
                }
            },
            {
                name: "Fieldset",
                factory: function factory() {
                    return import("./components/Fieldset");
                }
            },
            {
                name: "FileReader",
                factory: function factory() {
                    return import("./components/FileReader");
                }
            },
            {
                name: "Form",
                factory: function factory() {
                    return import("./components/Form");
                }
            },
            {
                name: "FormGroup",
                factory: function factory() {
                    return import("./components/FormGroup");
                }
            },
            {
                name: "Gallery",
                factory: function factory() {
                    return import("./components/Gallery");
                }
            },
            {
                name: "GoogleMap",
                factory: function factory() {
                    return import("./components/GoogleMap");
                }
            },
            {
                name: "Gravatar",
                factory: function factory() {
                    return import("./components/Gravatar");
                }
            },
            {
                name: "Grid",
                factory: function factory() {
                    return import("./components/Grid");
                }
            },
            {
                name: "Growl",
                factory: function factory() {
                    return import("./components/Growl");
                }
            },
            {
                name: "HtmlEditor",
                factory: function factory() {
                    return import("./components/HtmlEditor");
                }
            },
            {
                name: "Icon",
                factory: function factory() {
                    return import("./components/Icon");
                }
            },
            {
                name: "IconPicker",
                factory: function factory() {
                    return import("./components/IconPicker");
                }
            },
            {
                name: "Image",
                factory: function factory() {
                    return import("./components/Image");
                }
            },
            {
                name: "Input",
                factory: function factory() {
                    return import("./components/Input");
                }
            },
            {
                name: "Label",
                factory: function factory() {
                    return import("./components/Label");
                }
            },
            {
                name: "LazyImage",
                factory: function factory() {
                    return import("./components/LazyImage");
                }
            },
            {
                name: "Link",
                factory: function factory() {
                    return import("./components/Link");
                }
            },
            {
                name: "List",
                factory: function factory() {
                    return import("./components/List");
                }
            },
            {
                name: "Loader",
                factory: function factory() {
                    return import("./components/Loader");
                }
            },
            {
                name: "Logic",
                factory: function factory() {
                    return import("./components/Logic");
                }
            },
            {
                name: "MarkdownEditor",
                factory: function factory() {
                    return import("./components/MarkdownEditor");
                }
            },
            {
                name: "Modal",
                factory: function factory() {
                    return import("./components/Modal");
                }
            },
            {
                name: "Panel",
                factory: function factory() {
                    return import("./components/Panel");
                }
            },
            {
                name: "Password",
                factory: function factory() {
                    return import("./components/Password");
                }
            },
            {
                name: "Popover",
                factory: function factory() {
                    return import("./components/Popover");
                }
            },
            {
                name: "Progress",
                factory: function factory() {
                    return import("./components/Progress");
                }
            },
            {
                name: "RadioGroup",
                factory: function factory() {
                    return import("./components/RadioGroup");
                }
            },
            {
                name: "Search",
                factory: function factory() {
                    return import("./components/Search");
                }
            },
            {
                name: "Section",
                factory: function factory() {
                    return import("./components/Section");
                }
            },
            {
                name: "Select",
                factory: function factory() {
                    return import("./components/Select");
                }
            },
            {
                name: "Settings",
                factory: function factory() {
                    return import("./components/Settings");
                }
            },
            {
                name: "Switch",
                factory: function factory() {
                    return import("./components/Switch");
                }
            },
            {
                name: "Tabs",
                factory: function factory() {
                    return import("./components/Tabs");
                }
            },
            {
                name: "Tags",
                factory: function factory() {
                    return import("./components/Tags");
                }
            },
            {
                name: "Textarea",
                factory: function factory() {
                    return import("./components/Textarea");
                }
            },
            {
                name: "Tile",
                factory: function factory() {
                    return import("./components/Tile");
                }
            },
            {
                name: "Tooltip",
                factory: function factory() {
                    return import("./components/Tooltip");
                }
            },
            {
                name: "View",
                factory: function factory() {
                    return import("./components/View");
                }
            },
            {
                name: "ViewSwitcher",
                factory: function factory() {
                    return import("./components/ViewSwitcher");
                }
            },
            {
                name: "Wizard",
                factory: function factory() {
                    return import("./components/Wizard");
                }
            },
            {
                name: "Vendor.Cropper",
                factory: function factory() {
                    return import("./vendor/Cropper");
                }
            },
            {
                name: "Vendor.CodeMirror",
                factory: function factory() {
                    return import("./vendor/CodeMirror");
                }
            },
            {
                name: "Vendor.OwlCarousel",
                factory: function factory() {
                    return import("./vendor/OwlCarousel");
                }
            },
            {
                name: "Vendor.Quill",
                factory: function factory() {
                    return import("./vendor/Quill");
                }
            },
            {
                name: "Vendor.Select2",
                factory: function factory() {
                    return import("./vendor/Select2");
                }
            }
        ]);

        next();
    };
};

exports.app = app;
//# sourceMappingURL=index.js.map
