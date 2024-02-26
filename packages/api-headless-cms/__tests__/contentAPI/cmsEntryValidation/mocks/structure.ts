import { CmsApiModel, createCmsGroup, createCmsModel } from "~/plugins";
import { CmsModel } from "~/types";
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
    const cmsGroupPlugin = createCmsGroup({
        id: "validationstructuregroup",
        name: "Validation structure",
        slug: "validationstructuregroup",
        description: "Validation structure group description",
        icon: "fas/star"
    });
    const group = cmsGroupPlugin.contentModelGroup;
    const model = createModel({
        ...input,
        group
    });
    const cmsModelPlugin = createCmsModel(model);
    return {
        plugins: [cmsGroupPlugin, cmsModelPlugin],
        model,
        group
    };
};
