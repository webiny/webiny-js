import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, date, string } from "@webiny/commodo";
import { parse } from "fecha";
import { i18nField } from "./i18nFields";

enum DATE_TYPE {
    DATE_TIME_WITH_TIMEZONE = "dateTimeWithTimezone",
    DATE_TIME_WITHOUT_TIMEZONE = "dateTimeWithoutTimezone",
    DATE = "date",
    TIME = "time"
}

function createValidation(validation, format) {
    return async value => {
        if (typeof validation === "function") {
            await validation(value);
        }

        const error = Error(`Enter a string in the following format "${format}"`);
        if (format.length !== value.length) {
            throw error;
        }

        const date = parse(value, format);
        if (!date) {
            throw error;
        }
    };
}

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-datetime",
    type: "cms-model-field-to-commodo-field",
    fieldType: "datetime",
    sortable: true,
    apply({ model, field, validation, context }) {
        const type: DATE_TYPE = field.settings.type;
        let cField;
        switch (type) {
            case DATE_TYPE.DATE_TIME_WITH_TIMEZONE:
                cField = date({ validation });
                break;
            case DATE_TYPE.DATE_TIME_WITHOUT_TIMEZONE:
                cField = string({
                    validation: createValidation(validation, "YYYY-MM-DD HH:mm:ss")
                });
                break;
            case DATE_TYPE.DATE:
                cField = string({ validation: createValidation(validation, "YYYY-MM-DD") });
                break;
            case DATE_TYPE.TIME:
                cField = string({ validation: createValidation(validation, "HH:mm:ss") });
                break;
        }

        return withFields({
            [field.fieldId]: i18nField({
                field: cField,
                defaultValue: null,
                context
            })
        })(model);
    }
};

export default plugin;
