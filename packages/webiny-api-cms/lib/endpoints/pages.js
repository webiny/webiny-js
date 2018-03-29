"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _ = require("./../");

class Pages extends _webinyApi.EntityEndpoint {
    getEntityClass() {
        return _.Page;
    }
}

Pages.classId = "Cms.Pages";
Pages.version = "1.0.0";

exports.default = Pages;
//# sourceMappingURL=pages.js.map
