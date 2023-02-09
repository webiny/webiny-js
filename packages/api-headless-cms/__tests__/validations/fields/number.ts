import { FieldFactory } from "~tests/validations/fields/types";

const createFieldFactory: FieldFactory = field => {
    return () => {
        return {
            id: "numberFieldId",
            label: "Number field",
            type: "number",
            storageId: "number@numberFieldId",
            fieldId: "numberField",
            multipleValues: false,
            ...field
        };
    };
};

export const createNumberField = createFieldFactory();
