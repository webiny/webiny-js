// @flow
import fontawesome from "@fortawesome/fontawesome";
import solid from "@fortawesome/fontawesome-free-solid";
fontawesome.library.add(solid);

if (window) {
    window.jQuery = window.$ = require("jquery");
}

require("bootstrap-sass");

import growler from "./services/growler";

const app = () => {
    return ({ app }, next) => {
        app.services.register("growler", () => growler);

        app.modules.register([
            {
                name: "Accordion",
                factory: () => import("./components/Accordion")
            },
            {
                name: "Alert",
                factory: () => import("./components/Alert")
            },
            {
                name: "Animate",
                factory: () => import("./components/Animate")
            },
            {
                name: "AutoCompleteList",
                factory: () => import("./components/AutoCompleteList")
            },
            {
                name: "Avatar",
                factory: () => import("./components/Avatar")
            },
            {
                name: "Carousel",
                factory: () => import("./components/Carousel")
            },
            {
                name: "CodeEditor",
                factory: () => import("./components/CodeEditor")
            },
            {
                name: "CodeHighlight",
                factory: () => import("./components/CodeHighlight")
            },
            {
                name: "Copy",
                factory: () => import("./components/Copy")
            },
            {
                name: "Cropper",
                factory: () => import("./components/Cropper")
            },
            {
                name: "Date",
                factory: () => import("./components/Date")
            },
            {
                name: "DateRange",
                factory: () => import("./components/DateRange")
            },
            {
                name: "DateTime",
                factory: () => import("./components/DateTime")
            },
            {
                name: "DelayedOnChange",
                factory: () => import("./components/DelayedOnChange")
            },
            {
                name: "Downloader",
                factory: () => import("./components/Downloader")
            },
            {
                name: "DownloadLink",
                factory: () => import("./components/DownloadLink")
            },
            {
                name: "Dynamic",
                factory: () => import("./components/Dynamic")
            },
            {
                name: "File",
                factory: () => import("./components/File")
            },
            {
                name: "Fieldset",
                factory: () => import("./components/Fieldset")
            },
            {
                name: "FileReader",
                factory: () => import("./components/FileReader")
            },
            {
                name: "Form",
                factory: () => import("webiny-form").then(m => m.Form)
            },
            {
                name: "FormError",
                factory: () => import("./components/FormError")
            },
            {
                name: "FormGroup",
                factory: () => import("./components/FormGroup")
            },
            {
                name: "Gallery",
                factory: () => import("./components/Gallery")
            },
            {
                name: "GoogleMap",
                factory: () => import("./components/GoogleMap")
            },
            {
                name: "Gravatar",
                factory: () => import("./components/Gravatar")
            },
            {
                name: "Growl",
                factory: () => import("./components/Growl")
            },
            {
                name: "HtmlEditor",
                factory: () => import("./components/HtmlEditor")
            },
            {
                name: "IconPicker",
                factory: () => import("./components/IconPicker")
            },
            {
                name: "Image",
                factory: () => import("./components/Image")
            },
            {
                name: "LazyImage",
                factory: () => import("./components/LazyImage")
            },
            {
                name: "Loader",
                factory: () => import("./components/Loader")
            },
            {
                name: "Logic",
                factory: () => import("./components/Logic")
            },
            {
                name: "MarkdownEditor",
                factory: () => import("./components/MarkdownEditor")
            },
            {
                name: "Panel",
                factory: () => import("./components/Panel")
            },
            {
                name: "Popover",
                factory: () => import("./components/Popover")
            },
            {
                name: "Progress",
                factory: () => import("./components/Progress")
            },
            {
                name: "RadioGroup",
                factory: () => import("./components/RadioGroup")
            },
            {
                name: "Scrollbar",
                factory: () => import("./components/Scrollbar")
            },
            {
                name: "Search",
                factory: () => import("./components/Search")
            },
            {
                name: "Section",
                factory: () => import("./components/Section")
            },
            {
                name: "Settings",
                factory: () => import("./components/Settings")
            },
            {
                name: "Tags",
                factory: () => import("./components/Tags")
            },
            {
                name: "Tile",
                factory: () => import("./components/Tile")
            },
            {
                name: "Time",
                factory: () => import("./components/Time")
            },
            {
                name: "Tooltip",
                factory: () => import("./components/Tooltip")
            },
            {
                name: "View",
                factory: () => import("./components/View")
            },
            {
                name: "ViewSwitcher",
                factory: () => import("./components/ViewSwitcher")
            },
            {
                name: "Wizard",
                factory: () => import("./components/Wizard")
            },
            {
                name: "Vendor.Clipboard",
                factory: () => import("clipboard")
            },
            {
                name: "Vendor.Cropper",
                factory: () => import("./vendor/Cropper")
            },
            {
                name: "Vendor.CodeMirror",
                factory: () => import("./vendor/CodeMirror")
            },
            {
                name: "Vendor.FlatPickr",
                factory: () => import("./vendor/FlatPickr")
            },
            {
                name: "Vendor.OwlCarousel",
                factory: () => import("./vendor/OwlCarousel")
            },
            {
                name: "Vendor.Quill",
                factory: () => import("./vendor/Quill")
            },
            {
                name: "Vendor.ReactCustomScrollbars",
                factory: () => import("./vendor/ReactCustomScrollbars")
            },
            {
                name: "Vendor.Highlight",
                factory: () => import("./vendor/Highlight")
            },
            {
                name: "Vendor.Select2",
                factory: () => import("./vendor/Select2")
            }
        ]);

        next();
    };
};

export { app };
