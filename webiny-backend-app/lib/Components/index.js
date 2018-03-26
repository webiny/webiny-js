"use strict";

var _webinyClient = require("webiny-client");

_webinyClient.Webiny.registerModule(
    new _webinyClient.Webiny.Module("Webiny/Backend/UserRoles", function() {
        return import("./UserRoles");
    }),
    new _webinyClient.Webiny.Module("Webiny/Backend/UserRoleGroups", function() {
        return import("./UserRoleGroups");
    }),
    new _webinyClient.Webiny.Module("Webiny/Backend/UserPermissions", function() {
        return import("./UserPermissions");
    })
);
//# sourceMappingURL=index.js.map
