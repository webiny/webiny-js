import type { CmsContext, CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types/index.js";
import { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface BuildParams {
    input: string[];
    fields: CmsModelField[];
    plugins: Record<string, CmsModelFieldToGraphQLPlugin>;
    parents: string[];
}
const buildSearchableFieldList = (params: BuildParams): string[] => {
    const { input, plugins, fields, parents } = params;
    return fields.reduce<string[]>(
        (result, field) => {
            /**
             * We need to check if the field is full text searchable, and for that we need a plugin for the field type.
             */
            const plugin = plugins[field.type];
            if (!plugin) {
                return result;
            }
            /**
             * There is a possibility that searchable fields exist in nested object field, so check that as well.
             */
            const childFields = field.settings?.fields || [];
            if (childFields.length > 0) {
                /**
                 * So we build a list of searchable child fields and push it into the main result set.
                 */
                const childResults = buildSearchableFieldList({
                    fields: childFields,
                    parents: [...parents, field.fieldId],
                    plugins,
                    input
                });

                result.push(...childResults);
                return result;
            }
            /**
             * If not searchable, continue further.
             */
            if (!plugin.fullTextSearch || field.settings?.disableFullTextSearch === true) {
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
         * We always add id and entry id
         */
        ["id", "entryId"]
    );
};

interface Params {
    input: string[];
    fields: CmsModelField[];
    context: Pick<CmsContext, "plugins" | "container">;
}
export const getSearchableFields = (params: Params): string[] => {
    const { context, input, fields } = params;

    const registry = context.container.resolve(CmsModelFieldToGraphQLRegistry);

    const fieldPluginMap = registry.getAllAsPluginRecords();

    return buildSearchableFieldList({
        fields,
        input,
        plugins: fieldPluginMap,
        parents: ["values"]
    });
};
