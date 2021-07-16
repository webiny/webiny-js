import { CmsEditorField, CmsEditorFieldTypePlugin } from "~/types";
import { plugins } from "@webiny/plugins";

export function createFieldsList(fields: CmsEditorField[]) {
    const fieldPlugins = plugins
        .byType<CmsEditorFieldTypePlugin>("cms-editor-field-type")
        .reduce((acc, item) => ({ ...acc, [item.field.type]: item.field }), {});

    return fields
        .map(field => {
            const { graphql } = fieldPlugins[field.type];

            if (graphql && graphql.queryField) {
                const { queryField } = graphql;
                const selection =
                    typeof queryField === "string" ? queryField : queryField({ field });

                return `${field.fieldId} ${selection}`;
            }

            return field.fieldId;
        })
        .join("\n");
}
