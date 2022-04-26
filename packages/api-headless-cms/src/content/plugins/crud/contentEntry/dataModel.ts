import { createModel } from "@webiny/models";
import {
    createBooleanAttribute,
    createDateTimeAttribute,
    createNumberAttribute,
    createObjectAttribute,
    createStringAttribute
} from "@webiny/models";
export const createEntryDataModel = () => {
    return createModel({
        name: "entry",
        attributes: [
            createStringAttribute({
                name: "id"
            }),
            createStringAttribute({
                name: "entryId"
            }),
            createStringAttribute({
                name: "tenant"
            }),
            createStringAttribute({
                name: "locale"
            }),
            createStringAttribute({
                name: "webinyVersion"
            }),
            createStringAttribute({
                name: "modelId"
            }),
            createStringAttribute({
                name: "status"
            }),
            createDateTimeAttribute({
                name: "createdOn"
            }),
            createDateTimeAttribute({
                name: "savedOn"
            }),
            createDateTimeAttribute({
                name: "publishedOn"
            }),
            createNumberAttribute({
                name: "version"
            }),
            createObjectAttribute({
                name: "createdBy"
            }),
            createObjectAttribute({
                name: "ownedBy"
            }),
            createObjectAttribute({
                name: "values"
            }),
            createBooleanAttribute({
                name: "locked"
            })
        ]
    });
};
