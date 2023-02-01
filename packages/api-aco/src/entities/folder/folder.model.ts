import { CmsModel } from "@webiny/api-headless-cms/types";

import { createModelField } from "~/utils/createModelField";

export type FolderModelDefinition = Pick<
    CmsModel,
    "name" | "modelId" | "layout" | "titleFieldId" | "description" | "fields" | "isPrivate"
>;

const titleField = () =>
    createModelField({
        label: "Title",
        type: "text",
        parent: "folder",
        validation: [
            {
                name: "required",
                message: "Value is required."
            },
            {
                name: "minLength",
                settings: {
                    value: "3"
                },
                message: "Value is too short."
            }
        ]
    });

const slugField = () =>
    createModelField({
        label: "Slug",
        type: "text",
        parent: "folder",
        validation: [
            {
                name: "required",
                message: "Value is required."
            },
            {
                name: "minLength",
                settings: {
                    value: "3"
                },
                message: "Value is too short."
            },
            {
                name: "maxLength",
                settings: {
                    value: "100"
                },
                message: "Value is too long."
            },
            {
                name: "pattern",
                settings: {
                    preset: "custom",
                    regex: "^[a-z0-9]+(-[a-z0-9]+)*$",
                    flags: "g"
                },
                message: "Value must consist of only 'a-z', '0-9' and '-'."
            }
        ]
    });

const typeField = () =>
    createModelField({
        label: "Type",
        type: "text",
        parent: "folder",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const parentIdField = () =>
    createModelField({
        label: "Parent Id",
        type: "text",
        parent: "folder"
    });

export const FOLDER_MODEL_ID = "acoFolderModelDefinition";

export const createFolderModelDefinition = (): FolderModelDefinition => {
    return {
        name: "ACO - Folder",
        modelId: FOLDER_MODEL_ID,
        titleFieldId: "title",
        layout: [["folder_title"], ["folder_slug"], ["folder_type"], ["folder_parentId"]],
        fields: [titleField(), slugField(), typeField(), parentIdField()],
        description: "ACO - Folder content model",
        isPrivate: true
    };
};
