/**
 * Used to map sorting for custom CMS Models.
 */
import { type CmsEntryListSort } from "~/types/types.js";
import { CmsSortMapper, ICmsSortMapperParams } from "./abstractions.js";

interface IMapSortParams {
    input: CmsEntryListSort;
    isField: (key: string) => boolean;
}

class SortImpl implements CmsSortMapper.Interface {
    map(params: ICmsSortMapperParams): CmsEntryListSort | undefined {
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

        return input
            .map(sort => {
                const match = sort.match(/^(values_)?([a-zA-Z][a-zA-Z0-9]*)_(ASC|DESC)$/);
                if (!match) {
                    return null;
                }

                const [, hasValues, field, direction] = match;

                if (hasValues) {
                    return sort;
                }

                if (isField(field)) {
                    return `values_${field}_${direction}` as unknown as CmsEntryListSort[0];
                }

                return sort;
            })
            .filter((item): item is CmsEntryListSort[0] => !!item);
    }
}

export const SortMapper = CmsSortMapper.createImplementation({
    implementation: SortImpl,
    dependencies: []
});
