import { CmsModelField, CmsEditorFieldTypePlugin, CmsModel } from "~/types";
import { plugins } from "@webiny/plugins";

interface CreateFieldsListParams {
    model: CmsModel;
    fields: CmsModelField[];
}

export function createFieldsList({ model, fields }: CreateFieldsListParams): string {
    const fieldPlugins: Record<string, CmsEditorFieldTypePlugin["field"]> = plugins
        .byType<CmsEditorFieldTypePlugin>("cms-editor-field-type")
        .reduce((acc, item) => ({ ...acc, [item.field.type]: item.field }), {});

    return fields
        .map(field => {
            const { graphql } = fieldPlugins[field.type];

            if (graphql && graphql.queryField) {
                const { queryField } = graphql;
                const selection =
                    typeof queryField === "string" ? queryField : queryField({ model, field });

                return `${field.fieldId} ${selection}`;
            }

            return field.fieldId;
        })
        .join("\n");
}
