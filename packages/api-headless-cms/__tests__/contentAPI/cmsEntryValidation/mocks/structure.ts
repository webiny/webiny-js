import { type CmsApiModel, createModelPlugin } from "~/plugins";
import type { CmsModel } from "~/types";
import { createFields, createLayout } from "./fields";

const createModel = (model: Partial<Omit<CmsModel, "group">> & Pick<CmsModel, "group">) => {
    const fields = model.fields || createFields();
    return {
        modelId: "complexModel",
        name: "Complex model",
        singularApiName: "ComplexModel",
        pluralApiName: "ComplexModels",
        description: "",
        titleFieldId: "title",
        ...model,
        fields,
        layout: createLayout(fields)
    } as CmsApiModel;
};

export const createValidationStructure = (input: Partial<Omit<CmsModel, "group">> = {}) => {
    const model = createModel({
        ...input,
        group: "validationstructuregroup"
    });
    const cmsModelPlugin = createModelPlugin(model);
    return {
        plugins: [cmsModelPlugin],
        model
    };
};
