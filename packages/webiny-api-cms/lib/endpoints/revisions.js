"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _ = require("./../");

class Revisions extends _webinyApi.EntityEndpoint {
    getEntityClass() {
        return _.Revision;
    }
}

Revisions.classId = "Cms.Revisions";
Revisions.version = "1.0.0";

exports.default = Revisions;
//# sourceMappingURL=revisions.js.map
