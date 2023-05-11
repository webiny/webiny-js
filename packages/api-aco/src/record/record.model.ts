import { CmsModelField } from "@webiny/api-headless-cms/types";
import { createModelField } from "~/utils/createModelField";
import { CmsPrivateModelFull } from "@webiny/api-headless-cms";

export type SearchRecordModelDefinition = Omit<CmsPrivateModelFull, "noValidate" | "group">;

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
        type: "text"
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
        settings: { fields }
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
        settings: {
            fields
        }
    });
};

const tagsField = () =>
    createModelField({
        label: "Tags",
        type: "text",
        multipleValues: true
    });

export const SEARCH_RECORD_MODEL_ID = "acoSearchRecord";

interface CreateSearchModelDefinitionParams {
    fields?: CmsModelField[];
}

export const createSearchModelDefinition = (
    params?: CreateSearchModelDefinitionParams
): SearchRecordModelDefinition => {
    return {
        name: "ACO - Search Record",
        modelId: SEARCH_RECORD_MODEL_ID,
        titleFieldId: "title",
        layout: [["type"], ["title"], ["content"], ["location"], ["data"], ["tags"]],
        fields: [
            typeField(),
            titleField(),
            contentField(),
            locationField([locationFolderIdField()]),
            dataField(params?.fields),
            tagsField()
        ],
        description: "ACO - Search record model",
        isPrivate: true
    };
};
