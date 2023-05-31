import { CmsPrivateModelFull } from "@webiny/api-headless-cms";
import { createModelField } from "./createModelField";

export type FileModelDefinition = Omit<CmsPrivateModelFull, "noValidate" | "group">;

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

const privateField = () => {
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
            fields: [privateField()]
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

export const createFileModelDefinition = (): FileModelDefinition => {
    return {
        name: "File Manager - File",
        modelId: FILE_MODEL_ID,
        titleFieldId: "name",
        layout: [["name"], ["key"], ["type"], ["size"], ["meta"], ["tags"], ["aliases"]],
        fields: [
            nameField(),
            keyField(),
            typeField(),
            sizeField(),
            metaField(),
            tagsField(),
            aliasesField()
        ],
        description: "File Manager - File content model",
        isPrivate: true
    };
};
