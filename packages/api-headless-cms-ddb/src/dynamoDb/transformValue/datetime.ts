import { CmsFieldFilterValueTransformPlugin } from "../../types";
import { parseISO } from "date-fns";
import WebinyError from "@webiny/error";
import isNumber from "is-number";

export default (): CmsFieldFilterValueTransformPlugin<Date | string | number, number> => ({
    type: "cms-field-filter-value-transform",
    name: "cms-field-value-filter-transform-datetime",
    fieldType: "datetime",
    /**
     * Always transform into the milliseconds.
     */
    transform: ({ field, value }) => {
        const { type } = field.settings || {};
        /**
         * If field type is time, we check if value is already a number and return if yes.
         * Otherwise parse the time as the predefined format and return new number value.
         */
        if (type === "time") {
            const typeOf = typeof value;
            /**
             * Due to some internal JS stuff, we must check for a number like this.
             */
            if (isNumber(value) === true) {
                return Number(value);
            } else if (typeOf !== "string") {
                throw new WebinyError(
                    "Field value must be a string because field is defined as time.",
                    "TIME_PARSE_ERROR",
                    {
                        value
                    }
                );
            }
            const [time, milliseconds = 0] = (value as any).split(".");
            const values = time.split(":").map(Number);
            if (values.length < 2) {
                throw new WebinyError(
                    "Time must contain at least hours and minutes.",
                    "TIME_PARSE_ERROR",
                    {
                        value
                    }
                );
            }
            const [hours, minutes, seconds = 0] = values;
            return (hours * 60 * 60 + minutes * 60 + seconds) * 1000 + Number(milliseconds);
        } else if (value && typeof (value as any).getTime === "function") {
            /**
             * In this case we assume this is a date object and we just get the time.
             */
            return (value as Date).getTime();
        }
        const parsedDateTime = parseISO(value as any).getTime();
        if (isNaN(parsedDateTime) === false) {
            return parsedDateTime;
        }
        throw new WebinyError("Could not parse given date value.", "PARSE_DATE_ERROR", {
            value
        });
    }
});
