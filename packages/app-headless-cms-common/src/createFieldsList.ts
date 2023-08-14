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

    return fields
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

                return `${field.fieldId} ${selection}`;
            }

            return field.fieldId;
        })
        .filter(Boolean)
        .join("\n");
}
