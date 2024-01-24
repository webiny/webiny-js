import { CmsModelField, CmsModelGroup } from "@webiny/api-headless-cms/types";
import { CmsPrivateModelFull } from "@webiny/api-headless-cms";

import { fieldsField, stepsField, FIELD_FIELDS, STEP_FIELDS } from "./form.model";
import { createModelField } from "../createModelField";

const required = () => {
    return {
        name: "required",
        message: "Value is required."
    };
};

const dataField = () => {
    return createModelField({
        label: "Data",
        fieldId: "data",
        type: "json",
        validation: [required()]
    });
};

const metaIpField = () => {
    return createModelField({
        label: "IP",
        fieldId: "ip",
        type: "text"
    });
};

const metaSubmittedOnField = () => {
    return createModelField({
        label: "Submitted On",
        fieldId: "submittedOn",
        type: "datetime"
    });
};

const metaUrlLocationField = () => {
    return createModelField({
        label: "Location",
        fieldId: "location",
        type: "text"
    });
};

const metaUrlQueryField = () => {
    return createModelField({
        label: "Query",
        fieldId: "query",
        type: "json"
    });
};

const metaUrlField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "URL",
        fieldId: "url",
        type: "object",
        settings: {
            fields,
            layout: fields.map(field => [field.storageId])
        }
    });
};

const metaField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Meta",
        fieldId: "meta",
        type: "object",
        settings: {
            fields,
            layout: fields.map(field => [field.storageId])
        }
    });
};

const formIdField = () => {
    return createModelField({
        label: "ID",
        fieldId: "id",
        type: "text",
        validation: [required()]
    });
};

const formNameField = () => {
    return createModelField({
        label: "Name",
        fieldId: "name",
        type: "text",
        validation: [required()]
    });
};

const formParentField = () => {
    return createModelField({
        label: "Parent",
        fieldId: "parent",
        type: "text",
        validation: [required()]
    });
};

const versionField = () => {
    return createModelField({
        label: "Version",
        fieldId: "version",
        type: "text",
        validation: [required()]
    });
};

const formField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Form",
        fieldId: "form",
        type: "object",
        validation: [required()],
        settings: {
            fields,
            layout: fields.map(field => [field.storageId])
        }
    });
};

const logsField = () => {
    return createModelField({
        label: "Logs",
        fieldId: "logs",
        type: "json",
        multipleValues: true
    });
};

export const createSubmissionDataModelDefinition = (group: CmsModelGroup): CmsPrivateModelFull => {
    return {
        name: "FbSubmission",
        modelId: "fbSubmission",
        titleFieldId: "",
        group,
        fields: [
            dataField(),
            metaField([
                metaIpField(),
                metaSubmittedOnField(),
                metaUrlField([metaUrlLocationField(), metaUrlQueryField()])
            ]),
            formField([
                formIdField(),
                formNameField(),
                formParentField(),
                versionField(),
                fieldsField(FIELD_FIELDS),
                stepsField(STEP_FIELDS)
            ]),
            logsField()
        ],
        isPrivate: true,
        noValidate: true
    };
};
