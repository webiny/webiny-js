import WebinyError from "@webiny/error";
import { CmsFieldFilterValueTransformPlugin } from "../../types";
import { parse, parseISO } from "date-fns";

export default (): CmsFieldFilterValueTransformPlugin<Date | string | number, number> => ({
    type: "cms-field-filter-value-transform",
    name: "cms-field-value-filter-transform-datetime",
    fieldType: "datetime",
    /**
     * Always transform into the milliseconds.
     */
    transform: ({ field, value }) => {
        const { type = "datetimeWithoutTimezone" } = field.settings || {};
        if (!type) {
            throw new WebinyError("Missing type settings value.", "FIELD_SETTINGS_ERROR", {
                field
            });
        }
        /**
         * If field type is type we check if value is possibly a number already and return if yes.
         * Otherwise parse the time as the given format and return new number value.
         */
        if (type === "time") {
            if (typeof value === "number" || isNaN(value as any) === false) {
                return Number(value);
            }
            const d = new Date();
            const v = value instanceof Date ? value.toISOString() : value;
            const parsedDateTime = parse(v, "HH:mm:ss", d);
            return (parsedDateTime.getTime() - d.getTime()) / 1000;
        }
        const parsedDateTime = value instanceof Date ? value : parseISO(value as any);
        return parsedDateTime.getTime();
    }
});
