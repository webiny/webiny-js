import { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { CmsEntryOpenSearchValueSearch } from "../abstractions/CmsEntryOpenSearchValueSearch.js";
import { WebinyError } from "@webiny/error";
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

class SearchableJsonSearchImpl implements CmsEntryOpenSearchValueSearch.Interface {
    public readonly fieldType = "searchable-json";

    public transform(params: CmsEntryOpenSearchValueSearch.Transform): any {
        const { value } = params;

        if (NoValueContainer.is(value)) {
            return null;
        }

        const key = getKey(params);
        return value[key] || null;
    }

    public createPath(params: CmsEntryOpenSearchValueSearch.CreatePath): string | null {
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
}

export const SearchableJsonSearch = CmsEntryOpenSearchValueSearch.createImplementation({
    implementation: SearchableJsonSearchImpl,
    dependencies: []
});
