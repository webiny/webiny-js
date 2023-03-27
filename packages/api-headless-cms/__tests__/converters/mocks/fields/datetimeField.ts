import { createModelField } from "~tests/converters/mocks/utils";

export const createDateField = () => {
    return createModelField({
        fieldId: "dateOfBirth",
        type: "datetime",
        settings: {
            type: "date"
        }
    });
};
export const createDateFieldUndefined = () => {
    return createModelField({
        fieldId: "dateOfBirthUndefined",
        type: "datetime",
        settings: {
            type: "date"
        }
    });
};
export const createDateFieldEmpty = () => {
    return createModelField({
        fieldId: "dateOfBirthEmpty",
        type: "datetime",
        settings: {
            type: "date"
        }
    });
};
export const createTimeField = () => {
    return createModelField({
        fieldId: "timeOfSleep",
        type: "datetime",
        settings: {
            type: "time"
        }
    });
};
export const createTimeFieldUndefined = () => {
    return createModelField({
        fieldId: "timeOfSleepUndefined",
        type: "datetime",
        settings: {
            type: "time"
        }
    });
};
