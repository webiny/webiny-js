import { createField, CreateFieldInput } from "./fields";
import { createTimeGteValidation } from "~tests/contentAPI/cmsEntryValidation/mocks/validations";

export const createTimeField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "runningTime",
        type: "datetime",
        fieldId: "runningTime",
        label: "Running time",
        validation: [createTimeGteValidation("00:30")],
        settings: {
            type: "time"
        },
        ...params
    });
};
