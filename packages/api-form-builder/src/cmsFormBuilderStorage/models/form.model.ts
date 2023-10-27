import { createModelField } from "../creteModelField";
import { CmsModelField } from "@webiny/api-headless-cms/types";

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

const versionField = () => {
    return createModelField({
        label: "Version",
        type: "text",
        validation: [required()]
    });
};

const publishedField = () => {
    return createModelField({
        label: "Published",
        type: "text",
        validation: [required()]
    });
};

const statusField = () => {
    return createModelField({
        label: "Status",
        type: "text",
        validation: [required()]
    });
};

const fieldIdField = () => {
    return createModelField({
        label: "FieldId",
        type: "text",
        validation: [required()]
    });
};

const fieldsField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Fields",
        type: "object",
        validation: [required()],
        multipleValues: true,
        settings: {
            fields
        }
    });
};

// const stepLayoutField = () => {
//     return createModelField({
//         label: "Layout",
//         type: "object",
//         validation: [required()],
//         multipleValues: true
//     });
// };

const stepTitleField = () => {
    return createModelField({
        label: "FieldId",
        type: "text",
        validation: [required()]
    });
};

const stepsField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Steps",
        type: "object",
        validation: [required()],
        multipleValues: true,
        settings: {
            fields
        }
    });
};

const DEFAULT_FIELDS = ["name", "version", "published", "status", "fields", "steps"];

export const createFormDataModelDefinition = (): any => {
    return {
        name: "FbForm",
        modelId: "fbForm",
        titleFieldId: "name",
        layout: DEFAULT_FIELDS.map(field => [field]),
        fields: [
            nameField(),
            versionField(),
            publishedField(),
            statusField(),
            fieldsField([fieldIdField()]),
            stepsField([stepTitleField()])
        ],
        description: "Form Builder - Form builder create data model",
        isPrivate: true,
        noValidate: true
    };
};
