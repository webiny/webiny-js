import { createField, CreateFieldInput } from "./fields";
import { createDateGteValidation, createDateLteValidation } from "./validations";

export const createDateField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "releaseDate",
        type: "datetime",
        fieldId: "releaseDate",
        label: "Release date",
        validation: [createDateGteValidation("2020-01-01"), createDateLteValidation("2023-12-31")],
        settings: {
            type: "date"
        },
        ...params
    });
};
