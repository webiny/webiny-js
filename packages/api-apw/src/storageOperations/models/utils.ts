import camelCase from "lodash/camelCase";
import { CmsModelField } from "@webiny/api-headless-cms/types";
import { CreateModelFieldParams } from "~/plugins/utils";

export const createModelField = (params: CreateModelFieldParams): CmsModelField => {
    const { label, type, parent } = params;
    const alias = camelCase(label);
    return {
        id: `${camelCase(parent)}_${alias}`,
        storageId: alias,
        alias,
        label,
        type,
        settings: params.settings || {},
        listValidation: params.listValidation || [],
        validation: params.validation || [],
        multipleValues: params.multipleValues || false,
        predefinedValues: params.predefinedValues || {
            values: [],
            enabled: false
        }
    };
};
