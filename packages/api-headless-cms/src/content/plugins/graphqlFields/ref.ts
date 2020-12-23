import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { createTypeName } from "../utils/createTypeName";
import { createReadTypeName } from "../utils/createTypeName";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-ref",
    type: "cms-model-field-to-graphql",
    fieldType: "ref",
    isSortable: false,
    isSearchable: false,
    read: {
        createTypeField({ field }) {
            const { modelId } = field.settings;
            const gqlType = createReadTypeName(modelId);

            return field.fieldId + `: ${field.multipleValues ? `[${gqlType}]` : gqlType}`;
        },
        createResolver({ field }) {
            return instance => {
                return instance.values[field.fieldId];
            };
        }
    },
    manage: {
        createResolver({ field }) {
            return instance => {
                return instance.values[field.fieldId];
            };
        },
        createTypeField({ field }) {
            const { modelId } = field.settings;
            const refModelIdType = createTypeName(modelId);

            if (field.multipleValues) {
                return `${field.fieldId}: [${refModelIdType}]`;
            }

            return `${field.fieldId}: ${refModelIdType}`;
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": [RefInput]";
            }

            return field.fieldId + ": RefInput";
        }
    }
};

export default plugin;
