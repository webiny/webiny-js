// @flow
import { type EntityPluginType } from "@webiny/api/types";
import * as entities from "@webiny/api-cms/entities";

export default ([
    {
        name: "entity-content-model",
        type: "entity",
        entity: entities.contentModelFactory
    },
    {
        name: "entity-content-entry",
        type: "entity",
        entity: entities.contentEntryFactory
    }
]: Array<EntityPluginType>);
