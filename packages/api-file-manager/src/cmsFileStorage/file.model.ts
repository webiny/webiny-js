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

const metaOriginalKeyField = () => {
    return createModelField({
        label: "Original Key",
        type: "text"
    });
};

const metaField = () => {
    return createModelField({
        label: "Meta",
        type: "object",
        settings: {
            fields: [
                metaPrivateField(),
                metaWidthField(),
                metaHeightField(),
                metaOriginalKeyField()
            ]
        }
    });
};

const accessControlTypeField = () => {
    return createModelField({
        label: "Type",
        type: "text",
        predefinedValues: {
            enabled: true,
            values: [
                {
                    label: "Public",
                    value: "public",
                    selected: true
                },
                {
                    label: "Private",
                    value: "private-authenticated"
                }
            ]
        }
    });
};

const accessControlField = () => {
    return createModelField({
        label: "Access Control",
        type: "object",
        settings: {
            fields: [accessControlTypeField()]
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

const locationField = () => {
    return createModelField({
        type: "object",
        label: "Location",
        fieldId: "location",
        settings: {
            fields: [
                createModelField({
                    type: "text",
                    fieldId: "folderId",
                    label: "Folder ID",
                    settings: {
                        path: "location.folderId"
                    }
                })
            ]
        }
    });
};

export const FILE_MODEL_ID = "fmFile";

interface CreateFileModelDefinitionParams {
    contentModelGroup: CmsModelGroup;
    withPrivateFiles: boolean;
}

export const createFileModelDefinition = (
    params: CreateFileModelDefinitionParams
): CmsPrivateModelFull => {
    const fields = [
        locationField(),
        nameField(),
        keyField(),
        typeField(),
        sizeField(),
        metaField(),
        tagsField(),
        aliasesField()
    ];

    if (params.withPrivateFiles) {
        fields.push(accessControlField());
    }

    return {
        name: "FmFile",
        modelId: FILE_MODEL_ID,
        titleFieldId: "name",
        layout: [],
        fields,
        description: "File Manager - File content model",
        isPrivate: true,
        group: params.contentModelGroup,
        noValidate: true
    };
};
