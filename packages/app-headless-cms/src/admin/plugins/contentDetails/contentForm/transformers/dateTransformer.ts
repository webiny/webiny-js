import { CmsFieldValueTransformer } from "@webiny/app-headless-cms/types";
import WebinyError from "@webiny/error";

export default (): CmsFieldValueTransformer => ({
    type: "cms-field-value-transformer",
    name: "cms-field-value-transformer-date",
    fieldType: "datetime",
    transform: (value, field) => {
        // check types in packages/app-headless-cms/src/admin/plugins/fieldRenderers/dateTime/dateTimeField.tsx
        const type = field.settings.type;
        if (type === "time") {
            return value;
        }
        try {
            return new Date(value).toISOString();
        } catch (ex) {
            throw new WebinyError(`Could not transform "${value}" to a date.`, "TRANSFORM_ERROR", {
                message: ex.message,
                code: ex.code
            });
        }
    }
});
