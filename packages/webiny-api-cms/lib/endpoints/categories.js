"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _ = require("./../");

class Categories extends _webinyApi.EntityEndpoint {
    getEntityClass() {
        return _.Category;
    }
}

Categories.classId = "Cms.Categories";
Categories.version = "1.0.0";

exports.default = Categories;
//# sourceMappingURL=categories.js.map
