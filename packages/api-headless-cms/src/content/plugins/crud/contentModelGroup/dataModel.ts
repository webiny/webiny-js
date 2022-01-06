import {
    createDateTimeAttribute,
    createModel,
    createObjectAttribute,
    createStringAttribute
} from "@webiny/models";

export const createGroupDataModel = () => {
    return createModel({
        name: "group",
        attributes: [
            createStringAttribute({
                name: "id"
            }),
            createStringAttribute({
                name: "name"
            }),
            createStringAttribute({
                name: "slug"
            }),
            createStringAttribute({
                name: "locale"
            }),
            createStringAttribute({
                name: "tenant"
            }),
            createStringAttribute({
                name: "description"
            }),
            createStringAttribute({
                name: "webinyVersion"
            }),
            createStringAttribute({
                name: "icon"
            }),
            createObjectAttribute({
                name: "createdBy"
            }),
            createDateTimeAttribute({
                name: "createdOn"
            }),
            createDateTimeAttribute({
                name: "savedOn"
            })
        ]
    });
};
