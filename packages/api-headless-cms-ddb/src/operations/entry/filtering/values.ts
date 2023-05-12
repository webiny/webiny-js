import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

export const getWhereValues = (value: unknown, condition: "AND" | "OR") => {
    const values = value as CmsEntryListWhere[] | undefined;
    if (!Array.isArray(values)) {
        throw new WebinyError(
            `Trying to run filtering with "${condition}", but the value sent is not an array.`,
            `MALFORMED_${condition}_CONDITION`,
            {
                value
            }
        );
    } else if (values.length === 0) {
        throw new WebinyError(
            `Trying to run filtering with "${condition}", but the value sent is empty array.`,
            `MALFORMED_${condition}_CONDITION`,
            {
                value
            }
        );
    }
    return values;
};
