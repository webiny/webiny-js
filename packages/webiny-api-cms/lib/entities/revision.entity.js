"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _page = require("./page.entity");

var _page2 = _interopRequireDefault(_page);

var _webinyModel = require("webiny-model");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ContentBlockModel extends _webinyModel.Model {
    constructor() {
        super();
        this.attr("name").char();
    }
}

class Revision extends _webinyApi.Entity {
    constructor() {
        super();

        this.attr("page").entity(_page2.default);

        this.attr("name")
            .char()
            .setValidators("required");

        this.attr("title")
            .char()
            .setValidators("required");

        this.attr("slug")
            .char()
            .setValidators("required");

        this.attr("content").models(ContentBlockModel);

        this.attr("active")
            .boolean()
            .setDefaultValue(false);
    }
}

Revision.classId = "Cms.Revision";
Revision.tableName = "Cms_Revisions";

exports.default = Revision;
//# sourceMappingURL=revision.entity.js.map
