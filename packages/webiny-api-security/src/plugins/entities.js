// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api-security/entities";

const group: EntityPluginType = {
    name: "entity-group",
    type: "entity",
    entity: entities.groupFactory
};

const groups2entities: EntityPluginType = {
    name: "entity-groups-2-entities",
    type: "entity",
    entity: entities.groups2entitiesFactory
};

const role: EntityPluginType = {
    name: "entity-role",
    type: "entity",
    entity: entities.roleFactory
};

const roles2entities: EntityPluginType = {
    name: "entity-roles-2-entities",
    type: "entity",
    entity: entities.roles2entitiesFactory
};

const user: EntityPluginType = {
    name: "entity-user",
    type: "entity",
    entity: entities.userFactory
};

const userSettings: EntityPluginType = {
    name: "entity-user-settings",
    type: "entity",
    entity: entities.userSettingsFactory
};

export default [group, groups2entities, role, roles2entities, user, userSettings];
