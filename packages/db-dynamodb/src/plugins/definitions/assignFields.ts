import WebinyError from "@webiny/error";

export const assignFields = (rawInput: string | string[]): string[] => {
    const input = Array.isArray(rawInput) ? rawInput : [rawInput];
    if (input.length === 0) {
        throw new WebinyError(
            "Could not assign fields because there are none.",
            "ASSIGN_FIELDS_ERROR"
        );
    }
    const fields: string[] = [];
    for (const field of input) {
        /**
         * Need to make sure that no field is empty.
         */
        if (!field) {
            throw new WebinyError(
                "Passed empty field value into the plugin.",
                "EMPTY_FIELD_VALUE",
                {
                    fields: input
                }
            );
        }
        fields.push(field);
    }
    return fields;
};
