import type { CmsGroup, TestCmsModel } from "~tests/types";
import { createModelField } from "~/utils/createModelField.js";

export const createImageModel = (group: Pick<CmsGroup, "slug">): TestCmsModel => {
    const model: TestCmsModel = {
        name: "Images Model",
        modelId: "imagesModel",
        singularApiName: "ImagesModel",
        pluralApiName: "ImagesModels",
        fields: [
            createModelField({
                id: "name",
                fieldId: "name",
                type: "text",
                label: "Name",
                storageId: ""
            }),
            createModelField({
                id: "images",
                fieldId: "images",
                type: "object",
                label: "Images",
                storageId: "",
                multipleValues: true,
                settings: {
                    fields: [
                        createModelField({
                            id: "imagesImage",
                            fieldId: "image",
                            type: "file",
                            storageId: "",
                            label: "Image"
                        })
                    ],
                    layout: [["zrwlqm4x"]]
                }
            })
        ],
        layout: [],
        titleFieldId: "name",
        group: group.slug,
        description: "Images Model Description"
    };

    model.layout = model.fields.map(field => [field.id]);

    return model;
};
