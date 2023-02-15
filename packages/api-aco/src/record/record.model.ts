import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

import { createModelField } from "~/utils/createModelField";

export type SearchRecordModelDefinition = Pick<
    CmsModel,
    "name" | "modelId" | "layout" | "titleFieldId" | "description" | "fields" | "isPrivate"
>;

const originalIdField = () =>
    createModelField({
        label: "Original Id",
        type: "text",
        parent: "searchRecord",
        validation: [
            {
                name: "required",
                message: "Value is required."
            },
            {
                name: "unique",
                message: "Value must be unique."
            }
        ]
    });

const typeField = () =>
    createModelField({
        label: "Type",
        type: "text",
        parent: "searchRecord",
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
        parent: "searchRecord"
    });

const contentField = () =>
    createModelField({
        label: "Content",
        type: "text",
        parent: "searchRecord"
    });

const locationField = (fields: CmsModelField[]) =>
    createModelField({
        label: "Location",
        type: "object",
        parent: "searchRecord",
        multipleValues: false,
        settings: { fields }
    });

const locationFolderIdField = () =>
    createModelField({
        label: "Folder Id",
        type: "text",
        parent: "searchRecord Location",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const dataField = () =>
    createModelField({
        label: "Data",
        type: "wby-aco-json",
        parent: "searchRecord"
    });

export const SEARCH_RECORD_MODEL_ID = "acoSearchRecordModelDefinition";

export const createSearchModelDefinition = (): SearchRecordModelDefinition => {
    return {
        name: "ACO - Search Record",
        modelId: SEARCH_RECORD_MODEL_ID,
        titleFieldId: "originalId",
        layout: [
            ["searchRecord_originalId"],
            ["searchRecord_type"],
            ["searchRecord_title"],
            ["searchRecord_content"],
            ["searchRecord_location"],
            ["searchRecord_data"]
        ],
        fields: [
            originalIdField(),
            typeField(),
            titleField(),
            contentField(),
            locationField([locationFolderIdField()]),
            dataField()
        ],
        description: "ACO - Search record model",
        isPrivate: true
    };
};
