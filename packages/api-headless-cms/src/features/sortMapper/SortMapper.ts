/**
 * Used to map a model with custom schema with fields in a root to values object.
 * eg. File Manager File model has "title" and "tags" fields in the root, but they should be
 * mapped to "values.title" and "values.tags" when creating the entry.
 */
import { GenericRecord } from "@webiny/api/types.js";
import { type CmsEntryListSort } from "~/types/types.js";
import { CmsSortMapper, ICmsSortMapperParams } from "./abstractions.js";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (!value || typeof value !== "object") {
        return false;
    } else if (Array.isArray(value)) {
        return false;
    }
    return true;
};

const isLogicalKey = (key: string): key is "AND" | "OR" => {
    return key === "AND" || key === "OR";
};

interface IMapSortParams {
    input: CmsEntryListSort;
    isField: (key: string) => boolean;
}

class SortImpl implements CmsSortMapper.Interface {
    map<T extends GenericRecord>(params: ICmsSortMapperParams<T>): CmsEntryListSort | undefined {
        const { fields: modelFields, input } = params;
        if (!input) {
            return undefined;
        }

        const fields = modelFields.map(field => {
            return field.fieldId;
        });

        const isField = (key: string): boolean => {
            const field = key.split("_")[0];
            return fields.includes(field);
        };

        return this.mapSort({
            input,
            isField
        });
    }

    private mapSort(params: IMapSortParams): CmsEntryListSort {
        const { input, isField } = params;

        return input.map(sort => {
            const match = sort.match(/^(values_)?([a-zA-Z][a-zA-Z0-9]*)_(ASC|DESC)$/);
            if (!match) {
                return sort;
            }

            const [, hasValues, field, direction] = match;

            if (hasValues) {
                return sort;
            }

            if (isField(field)) {
                return `values_${field}_${direction}` as unknown as CmsEntryListSort[0];
            }

            return sort;
        });
    }
}

export const SortMapper = CmsSortMapper.createImplementation({
    implementation: SortImpl,
    dependencies: []
});
