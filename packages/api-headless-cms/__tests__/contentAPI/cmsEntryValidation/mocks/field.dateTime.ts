import { createField, CreateFieldInput } from "./fields";

export const createDateTimeField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "lastPublishedOn",
        type: "datetime",
        fieldId: "lastPublishedOn",
        label: "Last published on",
        settings: {
            type: "dateTimeWithTimezone"
        },
        ...params
    });
};
