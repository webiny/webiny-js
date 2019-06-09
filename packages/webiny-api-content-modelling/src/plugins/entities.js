// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api-content-modelling/entities";

const contentModel: EntityPluginType = {
    name: "entity-content-modelling-content-model",
    type: "entity",
    namespace: "cms",
    entity: {
        name: "ContentModel",
        factory: entities.contentModelFactory
    }
};

export default [contentModel];
