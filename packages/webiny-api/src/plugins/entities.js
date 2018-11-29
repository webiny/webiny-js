// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api/entities";

const apiToken: EntityPluginType = {
    name: "entity-api-token",
    type: "entity",
    namespace: "api",
    entity: {
        name: "ApiToken",
        factory: entities.apiTokenFactory
    }
};

const group: EntityPluginType = {
    name: "entity-group",
    type: "entity",
    namespace: "api",
    entity: {
        name: "Group",
        factory: entities.groupFactory
    }
};

const groups2entities: EntityPluginType = {
    name: "entity-groups-2-entities",
    type: "entity",
    namespace: "api",
    entity: {
        name: "Groups2Entities",
        factory: entities.groups2entitiesFactory
    }
};

const role: EntityPluginType = {
    name: "entity-role",
    type: "entity",
    namespace: "api",
    entity: {
        name: "Role",
        factory: entities.roleFactory
    }
};

const roles2entities: EntityPluginType = {
    name: "entity-roles-2-entities",
    type: "entity",
    namespace: "api",
    entity: {
        name: "Roles2Entities",
        factory: entities.roles2entitiesFactory
    }
};

const settings: EntityPluginType = {
    name: "entity-settings",
    type: "entity",
    namespace: "api",
    entity: {
        name: "Settings",
        factory: entities.settingsFactory
    }
};

const user: EntityPluginType = {
    name: "entity-user",
    type: "entity",
    namespace: "api",
    entity: {
        name: "User",
        factory: entities.userFactory
    }
};

const userSettings: EntityPluginType = {
    name: "entity-user-settings",
    type: "entity",
    namespace: "api",
    entity: {
        name: "UserSettings",
        factory: entities.userSettingsFactory
    }
};

const generalSettings: EntityPluginType = {
    name: "entity-general-settings",
    type: "entity",
    namespace: "api",
    entity: {
        name: "GeneralSettings",
        factory: entities.generalSettingsFactory
    }
};

export default [
    apiToken,
    group,
    groups2entities,
    role,
    roles2entities,
    settings,
    user,
    userSettings,
    generalSettings
];
