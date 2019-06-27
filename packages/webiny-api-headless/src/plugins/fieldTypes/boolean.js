// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";

export default ({
    name: "cms-headless-field-type-boolean",
    type: "cms-headless-field-type",
    fieldType: "boolean",
    i18n: false,
    read: {
        createTypeField({ field }) {
            return field.fieldId + ": Boolean";
        }
    },
    manage: {
        createTypeField({ field }) {
            return field.fieldId + ": Boolean";
        },
        createInputField({ field }) {
            return field.fieldId + ": Boolean";
        }
    }
}: HeadlessFieldTypePlugin);
