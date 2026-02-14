import type { FieldFactory } from "~tests/validations/fields/types";

const createFieldFactory: FieldFactory = base => {
    return field => {
        return {
            id: "numberFieldId",
            label: "Number field",
            type: "number",
            storageId: "number@numberFieldId",
            fieldId: "numberField",
            list: false,
            ...base,
            ...field
        };
    };
};

export const createNumberField = createFieldFactory();
