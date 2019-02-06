// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api/entities";

const settings: EntityPluginType = {
    name: "entity-settings",
    type: "entity",
    namespace: "api",
    entity: {
        name: "Settings",
        factory: entities.settingsFactory
    }
};

const file: EntityPluginType = {
    name: "entity-file",
    type: "entity",
    namespace: "api",
    entity: {
        name: "File",
        factory: entities.fileFactory
    }
};

export default [settings, file];
