import { IAcoAppRegisterParams } from "@webiny/api-aco/types";
import { FM_FILE_TYPE } from "~/contants";
import {CmsModel} from "@webiny/api-headless-cms/types";

export const createApp = (model: CmsModel): IAcoAppRegisterParams => {
    return {
        name: FM_FILE_TYPE,
        apiName: "Fm",
        fields: [
            {
                id: "id",
                fieldId: "id",
                type: "text",
                storageId: "id",
                label: "ID"
            },
            ...model.fields
        ]
    };
};
