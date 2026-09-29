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

        /*
         * `mapSort` has already stripped the direction, so what arrives here is a bare fieldId and
         * is compared whole. Taking the segment before the first `_` would fail every fieldId that
         * contains one: `on_sale` would be looked up as `on`.
         */
        const isField = (key: string): boolean => {
            return fields.includes(key);
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
                // `_` is allowed inside the fieldId: excluding it made `on_sale_DESC` unmatchable,
                // and an unmatched directive is dropped from the sort entirely.
                const match = sort.match(/^(values_)?([a-zA-Z][a-zA-Z0-9_]*)_(ASC|DESC)$/);
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
