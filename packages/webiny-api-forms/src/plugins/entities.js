// @flow
import { type EntityPluginType } from "webiny-api/types";
import { formFactory } from "webiny-api-forms/entities";

const form: EntityPluginType = {
    name: "entity-cms-form",
    type: "entity",
    entity: formFactory
};

export default [form];
