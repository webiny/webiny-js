import { CmsModelField, CmsModelFieldTypePlugin, CmsModel } from "~/types";
import { plugins } from "@webiny/plugins";

interface CreateFieldsListParams {
    model: CmsModel;
    fields: CmsModelField[];
    graphQLTypePrefix?: string;
}

export function createFieldsList({
    model,
    fields,
    graphQLTypePrefix
}: CreateFieldsListParams): string {
    const fieldPlugins: Record<string, CmsModelFieldTypePlugin["field"]> = plugins
        .byType<CmsModelFieldTypePlugin>("cms-editor-field-type")
        .reduce((acc, item) => ({ ...acc, [item.field.type]: item.field }), {});

    const typePrefix = graphQLTypePrefix ?? model.singularApiName;

    const allFields = fields
        .map(field => {
            if (!fieldPlugins[field.type]) {
                console.log(`Unknown field plugin for field type "${field.type}".`);
                return null;
            }
            const { graphql } = fieldPlugins[field.type];

            if (graphql && graphql.queryField) {
                const { queryField } = graphql;
                const selection =
                    typeof queryField === "string"
                        ? queryField
                        : queryField({ model, field, graphQLTypePrefix: typePrefix });

                /**
                 * If field type plugin returns `null`, we don't include the field in the selection.
                 */
                if (selection === null) {
                    return null;
                }

                return `${field.fieldId} ${selection}`;
            }

            return field.fieldId;
        })
        .filter(Boolean);

    /**
     * If there are no fields for a given type, we add a dummy `_empty` field, which will also be present in the schema
     * on the API side, to protect the schema from invalid types.
     */
    if (!allFields.length) {
        allFields.push("_empty");
    }

    return allFields.join("\n");
}
