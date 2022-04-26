import {
    createDateTimeAttribute,
    createListAttribute,
    createModel,
    createObjectAttribute,
    createStringAttribute
} from "@webiny/models";

export const createModelDataModel = () => {
    return createModel({
        name: "model",
        attributes: [
            createStringAttribute({
                name: "modelId"
            }),
            createStringAttribute({
                name: "name"
            }),
            createStringAttribute({
                name: "locale"
            }),
            createStringAttribute({
                name: "tenant"
            }),
            createStringAttribute({
                name: "titleFieldId"
            }),
            createStringAttribute({
                name: "webinyVersion"
            }),
            createStringAttribute({
                name: "description"
            }),
            createObjectAttribute({
                name: "createdBy"
            }),
            createObjectAttribute({
                name: "group"
            }),
            createDateTimeAttribute({
                name: "createdOn"
            }),
            createDateTimeAttribute({
                name: "savedOn"
            }),
            createListAttribute({
                name: "fields"
            }),
            createListAttribute({
                name: "layout"
            }),
            createListAttribute({
                name: "lockedFields"
            })
        ]
    });
};
