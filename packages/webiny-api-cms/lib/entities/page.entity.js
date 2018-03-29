"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _revision = require("./revision.entity");

var _revision2 = _interopRequireDefault(_revision);

var _category = require("./category.entity");

var _category2 = _interopRequireDefault(_category);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Page extends _webinyApi.Entity {
    constructor() {
        super();

        this.attr("title")
            .char()
            .setValidators("required");

        this.attr("slug")
            .char()
            .setValidators("required");

        this.attr("revisions").entities(_revision2.default);

        this.attr("category")
            .entity(_category2.default)
            .setValidators("required");

        this.attr("status")
            .char()
            .setValidators("in:draft:published:trash")
            .setDefaultValue("draft");
    }
}

Page.classId = "Cms.Page";
Page.tableName = "Cms_Pages";

exports.default = Page;
//# sourceMappingURL=page.entity.js.map
