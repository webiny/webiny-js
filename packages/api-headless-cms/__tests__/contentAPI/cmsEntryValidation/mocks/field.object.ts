import {
    createBooleanField,
    createDateField,
    createDateTimeField,
    createField,
    createFieldFieldId,
    CreateFieldInput,
    createFileField,
    createLongTextField,
    createNumberField,
    createReferenceField,
    createRichTextField,
    createTextField,
    createTimeField
} from "./fields";

export const createObjectField = (params: Partial<CreateFieldInput> = {}) => {
    const parentParams = {
        parentId: createFieldFieldId(
            {
                fieldId: "nested",
                multipleValues: params.multipleValues
            },
            params.parentId
        )
    };
    return createField({
        id: "nested",
        type: "object",
        fieldId: "nested",
        label: "Nested",
        validation: [
            {
                name: "required",
                message: "Nested object is required."
            }
        ],
        settings: {
            fields: [
                createTextField(parentParams),
                createLongTextField(parentParams),
                createRichTextField(parentParams),
                createNumberField(parentParams),
                createBooleanField(parentParams),
                createDateField(parentParams),
                createTimeField(parentParams),
                createDateTimeField(parentParams),
                createFileField(parentParams),
                createReferenceField(parentParams)
            ]
        },
        ...params
    });
};
