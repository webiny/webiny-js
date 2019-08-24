// @flow
import { type EntityPluginType } from "@webiny/api/types";
import * as entities from "@webiny/api/entities";

const settings: EntityPluginType = {
    name: "entity-settings",
    type: "entity",
    entity: entities.settingsFactory
};

export default [settings];
