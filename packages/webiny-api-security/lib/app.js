"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _auth = require("./endpoints/auth");

var _auth2 = _interopRequireDefault(_auth);

var _generator = require("./endpoints/generator");

var _generator2 = _interopRequireDefault(_generator);

var _index = require("./index");

var _registerAttributes = require("./attributes/registerAttributes");

var _registerAttributes2 = _interopRequireDefault(_registerAttributes);

var _users = require("./endpoints/users");

var _users2 = _interopRequireDefault(_users);

var _permissions = require("./endpoints/permissions");

var _permissions2 = _interopRequireDefault(_permissions);

var _roles = require("./endpoints/roles");

var _roles2 = _interopRequireDefault(_roles);

var _roleGroups = require("./endpoints/roleGroups");

var _roleGroups2 = _interopRequireDefault(_roleGroups);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Security extends _webinyApi.App {
    constructor(config) {
        super();

        this.name = "Security";
        _webinyApi.app.services.add(
            "authentication",
            () => new _index.AuthenticationService(config.authentication)
        );
        _webinyApi.app.services.add("authorization", () => new _index.AuthorizationService());

        this.endpoints = [
            (0, _generator2.default)(
                _auth2.default,
                config.authentication,
                _webinyApi.app.services.get("authentication")
            ),
            _users2.default,
            _permissions2.default,
            _roleGroups2.default,
            _roles2.default
        ];

        (0, _registerAttributes2.default)(_webinyApi.app.services.get("authentication"));

        // Helper attributes
        this.extendEntity("*", entity => {
            // "savedBy" attribute - updated on both create and update events.
            entity.attr("savedByClassId").char();
            entity.attr("savedBy").identity({ classIdAttribute: "savedByClassId" });

            // "createdBy" attribute - updated only on entity creation.
            entity.attr("createdByClassId").char();
            entity.attr("createdBy").identity({ classIdAttribute: "createdByClassId" });

            // "updatedBy" attribute - updated only on entity updates.
            entity.attr("updatedByClassId").char();
            entity.attr("updatedBy").identity({ classIdAttribute: "updatedByClassId" });

            // We don't need a standalone "deletedBy" attribute, since its value would be the same as in "savedBy"
            // and "updatedBy" attributes. Check these attributes to find out who deleted an entity.
            entity.on("save", () => {
                if (!_webinyApi.app.getRequest()) {
                    return;
                }

                const { identity } = _webinyApi.app.getRequest();
                entity.savedBy = identity;
                if (entity.isExisting()) {
                    entity.updatedBy = identity;
                } else {
                    entity.createdBy = identity;
                }
            });
        });
    }
}
exports.default = Security;
//# sourceMappingURL=app.js.map
