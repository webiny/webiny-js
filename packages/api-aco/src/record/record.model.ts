import { CmsModelField } from "@webiny/api-headless-cms/types";
import { createModelField } from "~/utils/createModelField";
import { createPrivateModel } from "@webiny/api-headless-cms";

const typeField = () =>
    createModelField({
        label: "Type",
        type: "text",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const titleField = () =>
    createModelField({
        label: "Title",
        type: "text",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const contentField = () =>
    createModelField({
        label: "Content",
        type: "text"
    });

const locationField = (fields: CmsModelField[]) =>
    createModelField({
        label: "Location",
        type: "object",
        multipleValues: false,
        validation: [
            {
                name: "required",
                message: "The location field must be populated."
            }
        ],
        settings: {
            fields
        }
    });

const locationFolderIdField = () =>
    createModelField({
        label: "Folder Id",
        type: "text",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const dataField = (fields?: CmsModelField[]) => {
    return createModelField({
        label: "Data",
        type: "object",
        multipleValues: false,
        validation: [
            {
                name: "required",
                message: "The data field must be populated."
            }
        ],
        settings: {
            fields
        }
    });
};

const tagsField = () =>
    createModelField({
        label: "Tags",
        type: "text",
        multipleValues: true,
        validation: [
            {
                name: "required",
                message: "The tags field must be populated."
            }
        ]
    });

export const SEARCH_RECORD_MODEL_ID = "acoSearchRecord";

interface CreateSearchModelParams {
    fields?: CmsModelField[];
}

export const DEFAULT_FIELDS = ["type", "title", "content", "location", "data", "tags"];

export const createSearchModel = (params?: CreateSearchModelParams) => {
    return createPrivateModel({
        name: "ACO - Search Record",
        modelId: SEARCH_RECORD_MODEL_ID,
        titleFieldId: "title",
        authorization: {
            // Disables base permission checks, but leaves FLP checks enabled.
            permissions: false

            // We're leaving FLP enabled (no need to set `flp: true`).
            // flp: true
        },
        fields: [
            typeField(),
            titleField(),
            contentField(),
            locationField([locationFolderIdField()]),
            dataField(params?.fields),
            tagsField()
        ]
    });
};
