import type { CmsModel } from "~/types/index.js";

export interface ICreateModelParams
    extends Partial<Omit<CmsModel, "fields">>, Pick<CmsModel, "fields"> {}

export const createModel = (base: ICreateModelParams): CmsModel => {
    const { fields } = base;
    return {
        name: "Test model",
        singularApiName: "TestModel",
        pluralApiName: "TestModels",
        titleFieldId: fields[0].fieldId,
        group: "group-slug",
        description: "",
        modelId: "test",
        icon: {
            type: "fas/flag",
            name: "fas/flag",
            value: "fas/flag"
        },
        layout: fields.map(field => {
            return [field.id];
        }),
        tenant: "root",
        ...(base || {}),
        fields
    };
};
