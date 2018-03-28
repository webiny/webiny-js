"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApp = require("webiny-app");

exports.default = function() {
    _webinyApp.Webiny.registerModule(
        new _webinyApp.Webiny.Module("Webiny/Vendors/C3", function() {
            return import("./C3");
        }),
        new _webinyApp.Webiny.Module("Webiny/Vendors/CodeMirror", function() {
            return import("./CodeMirror");
        }),
        new _webinyApp.Webiny.Module("Webiny/Vendors/Cropper", function() {
            return import("./Cropper");
        }),
        new _webinyApp.Webiny.Module("Webiny/Vendors/DateTimePicker", function() {
            return import("./DateTimePicker");
        }),
        new _webinyApp.Webiny.Module("Webiny/Vendors/Draft", function() {
            return import("./Draft");
        }),
        new _webinyApp.Webiny.Module("Webiny/Vendors/Highlight", function() {
            return import("./Highlight");
        }),
        new _webinyApp.Webiny.Module("Webiny/Vendors/Moment", function() {
            return import("./Moment");
        }),
        new _webinyApp.Webiny.Module("Webiny/Vendors/OwlCarousel", function() {
            return import("./OwlCarousel");
        }),
        new _webinyApp.Webiny.Module("Webiny/Vendors/Quill", function() {
            return import("./Quill");
        }),
        new _webinyApp.Webiny.Module("Webiny/Vendors/Select2", function() {
            return import("./Select2");
        })
    );
};
//# sourceMappingURL=index.js.map
