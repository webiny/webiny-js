import { createField, CreateFieldInput } from "./fields";

export const createBooleanField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "enabled",
        type: "boolean",
        fieldId: "enabled",
        label: "Enabled",
        ...params
    });
};
