import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

import { createModelField } from "~/utils/createModelField";

export type SearchRecordModelDefinition = Pick<
    CmsModel,
    "name" | "modelId" | "layout" | "titleFieldId" | "description" | "fields" | "isPrivate"
> & { isPrivate: true };

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

export const SEARCH_RECORD_MODEL_ID = "acoSearchRecord";

export const createSearchModelDefinition = (): SearchRecordModelDefinition => {
    return {
        name: "ACO - Search Record",
        modelId: SEARCH_RECORD_MODEL_ID,
        titleFieldId: "title",
        layout: [
            ["searchRecord_type"],
            ["searchRecord_title"],
            ["searchRecord_content"],
            ["searchRecord_location"],
            ["searchRecord_data"]
        ],
        fields: [
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
