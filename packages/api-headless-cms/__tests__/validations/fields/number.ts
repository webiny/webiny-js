import { FieldFactory } from "~tests/validations/fields/types";

const createFieldFactory: FieldFactory = base => {
    return field => {
        return {
            id: "numberFieldId",
            label: "Number field",
            type: "number",
            storageId: "number@numberFieldId",
            fieldId: "numberField",
            multipleValues: false,
            ...base,
            ...field
        };
    };
};

export const createNumberField = createFieldFactory();
