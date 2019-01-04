// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api-security/entities";

const group: EntityPluginType = {
    name: "entity-group",
    type: "entity",
    namespace: "security",
    entity: {
        name: "Group",
        factory: entities.groupFactory
    }
};

const groups2entities: EntityPluginType = {
    name: "entity-groups-2-entities",
    type: "entity",
    namespace: "security",
    entity: {
        name: "Groups2Entities",
        factory: entities.groups2entitiesFactory
    }
};

const role: EntityPluginType = {
    name: "entity-role",
    type: "entity",
    namespace: "security",
    entity: {
        name: "Role",
        factory: entities.roleFactory
    }
};

const roles2entities: EntityPluginType = {
    name: "entity-roles-2-entities",
    type: "entity",
    namespace: "security",
    entity: {
        name: "Roles2Entities",
        factory: entities.roles2entitiesFactory
    }
};

const user: EntityPluginType = {
    name: "entity-user",
    type: "entity",
    namespace: "security",
    entity: {
        name: "User",
        factory: entities.userFactory
    }
};

const userSettings: EntityPluginType = {
    name: "entity-user-settings",
    type: "entity",
    namespace: "security",
    entity: {
        name: "UserSettings",
        factory: entities.userSettingsFactory
    }
};

export default [group, groups2entities, role, roles2entities, user, userSettings];
