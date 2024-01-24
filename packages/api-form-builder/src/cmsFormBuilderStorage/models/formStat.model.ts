import { CmsModelGroup } from "@webiny/api-headless-cms/types";
import { CmsPrivateModelFull } from "@webiny/api-headless-cms";

import { createModelField } from "../createModelField";

const required = () => {
    return {
        name: "required",
        message: "Value is required."
    };
};

const formIdField = () => {
    return createModelField({
        label: "Form ID",
        fieldId: "formId",
        type: "text",
        validation: [required()]
    });
};

const formVersionField = () => {
    return createModelField({
        label: "Form Version",
        fieldId: "formVersion",
        type: "number",
        validation: [required()]
    });
};

const viewsField = () => {
    return createModelField({
        label: "Views",
        fieldId: "views",
        type: "number",
        validation: [required()]
    });
};

const submissionsField = () => {
    return createModelField({
        label: "Submissions",
        fieldId: "submissions",
        type: "number",
        validation: [required()]
    });
};

export const createFormStatDataModelDefinition = (group: CmsModelGroup): CmsPrivateModelFull => {
    return {
        name: "FbFormStat",
        modelId: "fbFormStat",
        titleFieldId: "",
        group,
        fields: [formIdField(), formVersionField(), viewsField(), submissionsField()],
        isPrivate: true,
        noValidate: true
    };
};
