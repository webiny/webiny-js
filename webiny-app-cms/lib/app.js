"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _paragraph = require("./widgets/paragraph");

var _paragraph2 = _interopRequireDefault(_paragraph);

var _image = require("./widgets/image");

var _image2 = _interopRequireDefault(_image);

var _CMS = require("./services/CMS");

var _CMS2 = _interopRequireDefault(_CMS);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function() {
    return function(_ref, next) {
        var app = _ref.app;

        app.services.register("cms", function() {
            return new _CMS2.default();
        });

        var cmsService = app.services.get("cms");

        // Render widgets
        cmsService.addWidget({
            type: "paragraph",
            widget: new _paragraph2.default()
        });
        cmsService.addWidget({
            type: "image",
            widget: new _image2.default()
        });

        app.router.addRoute({
            name: "CmsPreview",
            path: "/cms/preview/:revision"
        });

        next();
    };
};
//# sourceMappingURL=app.js.map
