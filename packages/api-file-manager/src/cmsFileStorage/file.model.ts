import { CmsPrivateModelFull } from "@webiny/api-headless-cms";
import { createModelField } from "./createModelField";
import { CmsModelGroup } from "@webiny/api-headless-cms/types";

const required = () => {
    return {
        name: "required",
        message: "Value is required."
    };
};

const nameField = () => {
    return createModelField({
        label: "Name",
        type: "text",
        validation: [required()]
    });
};

const keyField = () => {
    return createModelField({
        label: "Key",
        type: "text",
        validation: [required()]
    });
};

const typeField = () => {
    return createModelField({
        label: "Type",
        type: "text",
        validation: [required()]
    });
};

const sizeField = () => {
    return createModelField({
        label: "Size",
        type: "number",
        validation: [required()]
    });
};

const metaWidthField = () => {
    return createModelField({
        label: "Width",
        type: "number"
    });
};

const metaHeightField = () => {
    return createModelField({
        label: "Height",
        type: "number"
    });
};

const metaPrivateField = () => {
    return createModelField({
        label: "Private",
        type: "boolean"
    });
};

const metaField = () => {
    return createModelField({
        label: "Meta",
        type: "object",
        settings: {
            fields: [metaPrivateField(), metaWidthField(), metaHeightField()]
        }
    });
};

const tagsField = () => {
    return createModelField({
        label: "Tags",
        type: "text",
        multipleValues: true,
        validation: [required()]
    });
};

const aliasesField = () => {
    return createModelField({
        label: "Aliases",
        type: "text",
        multipleValues: true,
        validation: [required()]
    });
};

export const FILE_MODEL_ID = "fmFile";

export const createFileModelDefinition = (group: CmsModelGroup): CmsPrivateModelFull => {
    return {
        name: "FmFile",
        modelId: FILE_MODEL_ID,
        titleFieldId: "name",
        layout: [["name"], ["key"], ["type"], ["size"], ["meta"], ["tags"], ["aliases"]],
        fields: [
            {
                id: "location",
                type: "object",
                storageId: "location",
                label: "Location",
                fieldId: "location",
                settings: {
                    fields: [
                        {
                            id: "folderId",
                            type: "text",
                            fieldId: "folderId",
                            label: "Folder ID",
                            storageId: "folderId",
                            settings: {
                                path: "location.folderId"
                            }
                        }
                    ]
                }
            },
            nameField(),
            keyField(),
            typeField(),
            sizeField(),
            metaField(),
            tagsField(),
            aliasesField()
        ],
        description: "File Manager - File content model",
        isPrivate: true,
        group,
        noValidate: true
    };
};
