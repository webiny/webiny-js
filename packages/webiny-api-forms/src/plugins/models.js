// @flow
import { type ModelPluginType } from "webiny-api/types";
import { Form } from "webiny-api-forms/models";

const form: ModelPluginType = {
    name: "model-form",
    type: "model",
    model: Form
};

export default [form];
