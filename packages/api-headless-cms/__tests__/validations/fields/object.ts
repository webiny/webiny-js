import { FieldFactory } from "./types";
import { createTextField } from "./text";
import { createNumberField } from "./number";

const createFieldFactory: FieldFactory = field => {
    return () => {
        const textField = createTextField();
        const numberField = createNumberField();
        return {
            id: "objectFieldId",
            label: "Object field",
            type: "object",
            storageId: "object@objectFieldId",
            fieldId: "objectField",
            multipleValues: false,
            settings: {
                fields: [textField, numberField],
                layout: [[textField.id], [numberField.id]]
            },
            ...field
        };
    };
};

export const createObjectField = createFieldFactory();
