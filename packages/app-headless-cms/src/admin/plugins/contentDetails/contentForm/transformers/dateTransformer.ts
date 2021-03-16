import { CmsFieldValueTransformer } from "~/types";
import WebinyError from "@webiny/error";

const transformDate = (value: string, type: "date" | "datetime" | "time") => {
    if (type === "date") {
        return value.substr(0, 10);
    }
    return value;
};

const excludeTypesTransformation = ["time", "dateTimeWithTimezone"];

export default (): CmsFieldValueTransformer => ({
    type: "cms-field-value-transformer",
    name: "cms-field-value-transformer-date",
    fieldType: "datetime",
    transform: (value, field) => {
        // check types in packages/app-headless-cms/src/admin/plugins/fieldRenderers/dateTime/dateTimeField.tsx
        const type = field.settings.type;
        /**
         * No transformation for these types
         */
        if (excludeTypesTransformation.includes(type) === true) {
            return value;
        } else if (type === "dateTimeWithoutTimezone" && value.includes(" ")) {
            /**
             * Need to replace space and add .000Z to datetime value because it can look like: 2021-02-02 16:34:56
             */
            value = `${value.replace(" ", "T")}.000Z`;
        }
        try {
            const result = new Date(value).toISOString();
            return transformDate(result, type);
        } catch (ex) {
            throw new WebinyError(`Could not transform "${value}" to a date.`, "TRANSFORM_ERROR", {
                message: ex.message,
                code: ex.code
            });
        }
    }
});
