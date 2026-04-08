import type { CmsModel, CmsModelField } from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants.js";
import {
    CmsGraphQLSchemaSorter,
    type CmsModelFieldToGraphQLRegistry
} from "~/features/graphql/index.js";

interface RenderSortEnumParams {
    model: CmsModel;
    fields: CmsModelField[];
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    sorters: CmsGraphQLSchemaSorter.Interface[];
}

interface RenderSortEnum {
    (params: RenderSortEnumParams): string;
}

export const renderSortEnum: RenderSortEnum = ({
    model,
    fields,
    fieldRegistry,
    sorters
}): string => {
    const results: string[] = [
        `id_ASC`,
        `id_DESC`,

        ...ENTRY_META_FIELDS.filter(isDateTimeEntryMetaField)
            .map(field => [`${field}_ASC`, `${field}_DESC`])
            .flat()
    ];

    for (const field of fields) {
        const plugin = fieldRegistry.get(getBaseFieldType(field));
        if (!plugin?.isSortable) {
            continue;
        }
        results.push(`values_${field.fieldId}_ASC`);
        results.push(`values_${field.fieldId}_DESC`);
    }
    if (sorters.length === 0) {
        return results.join("\n");
    }

    return sorters
        .reduce((result, sorter) => {
            return sorter.execute({
                model,
                sorters: result
            });
        }, results)
        .join("\n");
};
