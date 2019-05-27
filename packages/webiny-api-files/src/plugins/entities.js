// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api-files/entities";

const file: EntityPluginType = {
    name: "entity-files-file",
    type: "entity",
    namespace: "files",
    entity: {
        name: "File",
        factory: entities.fileFactory
    }
};

export default [file];
