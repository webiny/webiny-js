import { createField, CreateFieldInput } from "./field.base";

export const createNumberField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "price",
        type: "number",
        fieldId: "price",
        label: "Price",
        validation: [
            {
                name: "gte",
                message: "Value must be greater than or equal to 1.",
                settings: {
                    value: 1
                }
            }
        ],
        ...params
    });
};
