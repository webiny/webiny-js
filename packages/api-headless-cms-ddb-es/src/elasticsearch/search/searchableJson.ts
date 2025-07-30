import { CmsEntryElasticsearchQueryBuilderValueSearchPlugin } from "~/plugins/CmsEntryElasticsearchQueryBuilderValueSearchPlugin";
import { WebinyError } from "@webiny/error";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { NoValueContainer } from "~/values/NoValueContainer.js";

interface IGetKeyParams {
    field: CmsModelField;
    value: {
        [key: string]: any;
    };
}

const getKey = (params: IGetKeyParams): string => {
    const { field, value } = params;
    const keys = Object.keys(value);
    if (keys.length === 0) {
        throw new WebinyError(
            `Searchable JSON field "${field.fieldId}" cannot be empty.`,
            "EMPTY_SEARCHABLE_JSON_FIELD",
            {
                field,
                value
            }
        );
    } else if (keys.length > 1) {
        throw new WebinyError(
            `Searchable JSON field "${field.fieldId}" can only have one key.`,
            "MULTIPLE_KEYS_IN_SEARCHABLE_JSON_FIELD",
            {
                field,
                value,
                keys
            }
        );
    }
    return keys[0];
};

export const createSearchableJsonSearchPlugin =
    (): CmsEntryElasticsearchQueryBuilderValueSearchPlugin => {
        return new CmsEntryElasticsearchQueryBuilderValueSearchPlugin({
            fieldType: "searchable-json",
            transform: params => {
                const { value } = params;

                if (NoValueContainer.is(value)) {
                    return null;
                }

                const key = getKey(params);
                return value[key] || null;
            },
            path: params => {
                const { field } = params;

                if (NoValueContainer.is(params.originalValue)) {
                    return `${field.storageId}.unknown`;
                }

                const key = getKey({
                    field,
                    value: params.originalValue
                });

                return `${field.storageId}.${key}`;
            }
        });
    };
