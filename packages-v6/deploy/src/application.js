"use strict";
exports.__esModule = true;
exports.createAPIApplication = void 0;
var pulumi_sdk_v6_1 = require("@webiny/pulumi-sdk-v6");
var createAPIApplication = function (_a) {
    var onResource = _a.onResource, tagResources = _a.tagResources;
    var APIApplication = (0, pulumi_sdk_v6_1.defineApp)({
        name: "API",
        config: function (app) {
            app.onResource(onResource);
            app.addHandler(tagResources);
            return {};
        }
    });
    return new APIApplication();
};
exports.createAPIApplication = createAPIApplication;
