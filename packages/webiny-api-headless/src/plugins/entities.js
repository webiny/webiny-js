// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api-headless/entities";

export default ([
    {
        name: "entity-headless-content-model",
        type: "entity",
        namespace: "cms",
        entity: {
            name: "ContentModel",
            factory: entities.contentModelFactory
        }
    },
    {
        name: "entity-headless-content-entry",
        type: "entity",
        namespace: "cms",
        entity: {
            name: "ContentEntry",
            factory: entities.contentEntryFactory
        }
    }
]: Array<EntityPluginType>);
