// @flow
import { type EntityPluginType } from "@webiny/api/types";
import * as entities from "@webiny/api-headless/entities";

export default ([
    {
        name: "entity-headless-content-model",
        type: "entity",
        entity: entities.contentModelFactory
    },
    {
        name: "entity-headless-content-entry",
        type: "entity",
        entity: entities.contentEntryFactory
    }
]: Array<EntityPluginType>);
