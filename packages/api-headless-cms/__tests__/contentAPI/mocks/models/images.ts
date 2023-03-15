import { CmsGroup, CmsModel } from "~tests/types";

export const createImageModel = (group: Pick<CmsGroup, "id" | "name">): CmsModel => {
    const model: CmsModel = {
        name: "Images Model",
        modelId: "imagesModel",
        singularApiName: "ImagesModel",
        pluralApiName: "ImagesModels",
        fields: [
            {
                id: "name",
                fieldId: "name",
                type: "text",
                label: "Name",
                storageId: ""
            },
            {
                id: "images",
                fieldId: "images",
                type: "object",
                label: "Images",
                storageId: "",
                multipleValues: true,
                settings: {
                    fields: [
                        {
                            id: "imagesImage",
                            fieldId: "image",
                            type: "file",
                            storageId: "",
                            label: "Image"
                        }
                    ],
                    layout: [["zrwlqm4x"]]
                }
            }
        ],
        layout: [],
        titleFieldId: "name",
        group: {
            id: group.id,
            name: group.name
        },
        description: "Images Model Description"
    };

    model.layout = model.fields.map(field => [field.id]);

    return model;
};
