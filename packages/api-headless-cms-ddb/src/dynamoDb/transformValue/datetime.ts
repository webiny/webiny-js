/**
 * File is @internal
 */
import { CmsFieldFilterValueTransformPlugin } from "~/types";
import { TimeTransformPlugin } from "@webiny/db-dynamodb/plugins/definitions/TimeTransformPlugin";
import { DateTimeTransformPlugin } from "@webiny/db-dynamodb/plugins/definitions/DateTimeTransformPlugin";

const timeTransformer = new TimeTransformPlugin({
    fields: ["*"]
});
const dateTimeTransformer = new DateTimeTransformPlugin({
    fields: ["*"]
});

export const createDatetimeTransformValuePlugin = (): CmsFieldFilterValueTransformPlugin => {
    return {
        type: "cms-field-filter-value-transform",
        name: "cms-field-value-filter-transform-datetime",
        fieldType: "datetime",
        /**
         * Always transform into the milliseconds.
         */
        transform: ({ field, value }) => {
            const { type } = field.settings || {};
            if (type === "time") {
                return timeTransformer.transform({
                    value
                });
            }
            return dateTimeTransformer.transform({
                value
            });
        }
    };
};
