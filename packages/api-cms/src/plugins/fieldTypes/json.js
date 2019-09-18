// @flow
import type { CmsFieldTypePlugin } from "@webiny/api-cms/types";
import genericFieldValueResolver from "@webiny/api-cms/utils/genericFieldValueResolver";
import genericFieldValueSetter from "@webiny/api-cms/utils/genericFieldValueSetter";

export default ({
    name: "cms-field-type-json",
    type: "cms-field-type",
    fieldType: "json",
    isSortable: false,
    read: {
        createResolver() {
            return genericFieldValueResolver;
        },
        createTypeField({ field }) {
            return field.fieldId + ": JSON";
        }
    },
    manage: {
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type CmsManageJSON {
                    locale: String
                    value: JSON
                }

                input CmsManageJSONInput {
                    locale: String!
                    value: JSON!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [CmsManageJSON]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [CmsManageJSONInput]";
        }
    }
}: CmsFieldTypePlugin);
