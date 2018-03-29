"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _page = require("./page.entity");

var _page2 = _interopRequireDefault(_page);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Category extends _webinyApi.Entity {
    constructor() {
        super();

        this.attr("title")
            .char()
            .setValidators("required");

        this.attr("slug")
            .char()
            .setValidators("required");

        this.attr("pages").entities(_page2.default);
    }
}

Category.classId = "Cms.Category";
Category.tableName = "Cms_Categories";

exports.default = Category;
//# sourceMappingURL=category.entity.js.map
