import type { CmsContext, CmsModelField } from "~/types/index.js";
import { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface BuildParams {
    input: string[];
    fields: CmsModelField[];
    registry: CmsModelFieldToGraphQLRegistry.Interface;
    parents: string[];
}
const buildSearchableFieldList = (params: BuildParams): string[] => {
    const { input, registry, fields, parents } = params;
    return fields.reduce<string[]>(
        (result, field) => {
            const fieldImpl = registry.get(field.type);
            if (!fieldImpl) {
                return result;
            }
            /**
             * There is a possibility that searchable fields exist in nested object field, so check that as well.
             */
            const childFields = field.settings?.fields || [];
            if (childFields.length > 0) {
                const childResults = buildSearchableFieldList({
                    fields: childFields,
                    parents: [...parents, field.fieldId],
                    registry,
                    input
                });

                result.push(...childResults);
                return result;
            }
            /**
             * If not searchable, continue further.
             */
            if (!fieldImpl.isFullTextSearchable || field.settings?.disableFullTextSearch === true) {
                return result;
            }

            /**
             * Combine all parent paths with the current one and push it.
             */
            const path = [...parents, field.fieldId].join(".");
            result.push(path);

            return result;
        },
        /**
         * We always add id and entry id.
         */
        ["id", "entryId"]
    );
};

interface Params {
    input: string[];
    fields: CmsModelField[];
    context: Pick<CmsContext, "container">;
}
export const getSearchableFields = (params: Params): string[] => {
    const { context, input, fields } = params;

    const registry = context.container.resolve(CmsModelFieldToGraphQLRegistry);

    return buildSearchableFieldList({
        fields,
        input,
        registry,
        parents: ["values"]
    });
};
