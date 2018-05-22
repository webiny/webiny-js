"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApp = require("webiny-app");

exports.default = function() {
    var cmsService = _webinyApp.app.services.get("cms");

    cmsService.addWidgetGroup({
        name: "text",
        title: "Text",
        icon: "font"
    });

    cmsService.addWidgetGroup({
        name: "media",
        title: "Media",
        icon: "image"
    });

    cmsService.addWidgetGroup({
        name: "global",
        title: "Global",
        icon: "globe"
    });
};
//# sourceMappingURL=registerWidgets.js.map
