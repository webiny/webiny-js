import { createCmsModel, CmsGroupPlugin } from "@webiny/api-headless-cms";
import { CmsModelField, CmsModelFieldValidation } from "@webiny/api-headless-cms/types";
import lodashCamelCase from "lodash/camelCase";

export const SETTINGS_MODEL_ID = "mailerSettings";

interface CreateFieldParams {
    label: string;
    required?: boolean;
}
const createField = (params: CreateFieldParams): CmsModelField => {
    const { label, required } = params;
    const id = lodashCamelCase(label);

    const validation: CmsModelFieldValidation[] = [];
    if (required) {
        validation.push({
            message: `Field "${label}" is required!`,
            name: "required",
            settings: {}
        });
    }
    return {
        label,
        id,
        fieldId: id,
        storageId: id,
        type: "text",
        validation
    };
};

export const createSettingsModel = (group: CmsGroupPlugin) => {
    return createCmsModel({
        modelId: SETTINGS_MODEL_ID,
        name: "Mailer Settings",
        group: {
            id: group.contentModelGroup.id,
            name: group.contentModelGroup.name
        },
        fields: [
            createField({
                label: "Host",
                required: true
            }),
            createField({
                label: "User",
                required: true
            }),
            createField({
                label: "Password",
                required: true
            }),
            createField({
                label: "From",
                required: true
            }),
            createField({
                label: "Reply-To"
            })
        ],
        layout: [["host", "user", "password", "from", "replyTo"]],
        description: "Mailer Settings",
        titleFieldId: ""
    });
};
