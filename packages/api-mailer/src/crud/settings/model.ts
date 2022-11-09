import { createCmsModel, CmsGroupPlugin } from "@webiny/api-headless-cms";
import { CmsModelField, CmsModelFieldValidation } from "@webiny/api-headless-cms/types";
import lodashCamelCase from "lodash/camelCase";

export const SETTINGS_MODEL_ID = "mailerSettings";

interface CreateFieldParams {
    type: string;
    label: string;
    required?: boolean;
}
const createField = (params: CreateFieldParams): CmsModelField => {
    const { label, required, type } = params;
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
        type,
        validation
    };
};

const createTextField = (params: Omit<CreateFieldParams, "type">) => {
    return createField({
        ...params,
        type: "text"
    });
};
const createNumberField = (params: Omit<CreateFieldParams, "type">) => {
    return createField({
        ...params,
        type: "number"
    });
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
            createTextField({
                label: "Host",
                required: true
            }),
            createNumberField({
                label: "Port"
            }),
            createTextField({
                label: "User",
                required: true
            }),
            createTextField({
                label: "Password",
                required: true
            }),
            createTextField({
                label: "From",
                required: true
            }),
            createTextField({
                label: "Reply-To"
            })
        ],
        layout: [["host", "port", "user", "password", "from", "replyTo"]],
        description: "Mailer Settings",
        titleFieldId: "",
        isPrivate: true
    });
};
