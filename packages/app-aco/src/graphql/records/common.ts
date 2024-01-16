import { AcoModel, AcoModelField } from "~/types";
import { plugins } from "@webiny/plugins";

export const ERROR_FIELD = /* GraphQL */ `
    error {
        code
        data
        message
    }
`;
interface CreateFieldsListParams {
    model: AcoModel;
    fields: AcoModelField[];
}

const defaultFields = [
    "id",
    "createdOn",
    "savedOn",
    "modifiedOn",
    "createdBy {id type displayName}",
    "savedBy {id type displayName}",
    "modifiedBy {id type displayName}"
];

const createFieldsList = ({ model, fields }: CreateFieldsListParams): string => {
    const fieldPlugins: Record<string, any> = plugins
        .byType("cms-editor-field-type")
        .reduce((acc: any, item: any) => ({ ...acc, [item.field.type]: item.field }), {});

    return fields
        .reduce<string[]>(
            (collection, field) => {
                if (!fieldPlugins[field.type]) {
                    console.log(`Unknown field plugin for field type "${field.type}".`);
                    return collection;
                }
                const { graphql } = fieldPlugins[field.type];

                if (graphql && graphql.queryField) {
                    const { queryField } = graphql;
                    const selection =
                        typeof queryField === "string" ? queryField : queryField({ model, field });

                    collection.push(`${field.fieldId} ${selection}`);
                    return collection;
                }

                collection.push(field.fieldId);

                return collection;
            },
            [...defaultFields]
        )
        .join("\n");
};

export const createAppFields = (model: AcoModel) => {
    return createFieldsList({
        model,
        fields: model.fields
    });
};

export const LIST_META_FIELD = /* GraphQL */ `
    meta {
        cursor
        totalCount
        hasMoreItems
    }
`;
