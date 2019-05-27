// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api-forms/entities";

const form: EntityPluginType = {
    name: "entity-cms-form",
    type: "entity",
    namespace: "cms",
    entity: {
        name: "Form",
        factory: entities.formFactory
    }
};

export default [form];
