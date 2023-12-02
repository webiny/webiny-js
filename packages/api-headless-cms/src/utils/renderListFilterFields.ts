import {
    ApiEndpoint,
    CmsFieldTypePlugins,
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin
} from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import { ENTRY_META_FIELDS } from "~/constants";

interface RenderListFilterFieldsParams {
    model: CmsModel;
    fields: CmsModelField[];
    type: ApiEndpoint;
    fieldTypePlugins: CmsFieldTypePlugins;
    excludeFields?: string[];
}

interface RenderListFilterFields {
    (params: RenderListFilterFieldsParams): string;
}

type CreateListFiltersType =
    | CmsModelFieldToGraphQLPlugin["read"]["createListFilters"]
    | CmsModelFieldToGraphQLPlugin["manage"]["createListFilters"];

export const renderListFilterFields: RenderListFilterFields = (params): string => {
    const { model, fields, type, fieldTypePlugins, excludeFields = [] } = params;
    const result: string[] = [
        "id: ID",
        "id_not: ID",
        "id_in: [ID!]",
        "id_not_in: [ID!]",
        "entryId: String",
        "entryId_not: String",
        "entryId_in: [String!]",
        "entryId_not_in: [String!]",

        /**
         * 🚫 Deprecated meta fields below.
         * Will be fully removed in one of the next releases.
         */

        // Deprecated. Use `revisionCreatedBy` instead.
        "createdOn: DateTime",
        "createdOn_gt: DateTime",
        "createdOn_gte: DateTime",
        "createdOn_lt: DateTime",
        "createdOn_lte: DateTime",
        "createdOn_between: [DateTime!]",
        "createdOn_not_between: [DateTime!]",

        // Deprecated. Use `revisionSavedOn` instead.
        "savedOn: DateTime",
        "savedOn_gt: DateTime",
        "savedOn_gte: DateTime",
        "savedOn_lt: DateTime",
        "savedOn_lte: DateTime",
        "savedOn_between: [DateTime!]",
        "savedOn_not_between: [DateTime!]",

        // Deprecated. Use `entryFirstPublishedOn` instead.
        "publishedOn: DateTime",
        "publishedOn_gt: DateTime",
        "publishedOn_gte: DateTime",
        "publishedOn_lt: DateTime",
        "publishedOn_lte: DateTime",
        "publishedOn_between: [DateTime!]",
        "publishedOn_not_between: [DateTime!]",

        // Deprecated. Use `revisionCreatedBy` instead.
        "createdBy: String",
        "createdBy_not: String",
        "createdBy_in: [String!]",
        "createdBy_not_in: [String!]",

        // Deprecated. Use `entryCreatedBy` instead.
        "ownedBy: String",
        "ownedBy_not: String",
        "ownedBy_in: [String!]",
        "ownedBy_not_in: [String!]",

        /**
         * 🆕 New meta fields below.
         * Users are encouraged to use these instead of the deprecated ones above.
         */
        ...ENTRY_META_FIELDS.map(field => {
            if (field.endsWith("On")) {
                return [
                    `${field}: DateTime`,
                    `${field}_gt: DateTime`,
                    `${field}_gte: DateTime`,
                    `${field}_lt: DateTime`,
                    `${field}_lte: DateTime`,
                    `${field}_between: [DateTime!]`,
                    `${field}_not_between: [DateTime!]`
                ];
            }

            return [
                `${field}: ID`,
                `${field}_not: ID`,
                `${field}_in: [ID!]`,
                `${field}_not_in: [ID!]`
            ];
        }).flat()
    ];

    /**
     * We can find different statuses only in the manage API endpoint.
     */
    if (type === "manage") {
        result.push(
            "status: String",
            "status_not: String",
            "status_in: [String!]",
            "status_not_in: [String!]"
        );
    }

    const finalFields = result.filter(field => {
        return !excludeFields.some(excl => {
            return field.startsWith(`${excl}_`) || field.startsWith(`${excl}: `);
        });
    });

    for (const field of fields) {
        // Every time a client updates content model's fields, we check the type of each field. If a field plugin
        // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
        // want to be careful when accessing the field plugin here too. It is still possible to have a content model
        // that contains a field, for which we don't have a plugin registered on the backend. For example, user
        // could've just removed the plugin from the backend.
        const baseType = getBaseFieldType(field);
        const createListFilters: CreateListFiltersType | undefined =
            fieldTypePlugins[baseType]?.[type]?.createListFilters;
        if (typeof createListFilters !== "function") {
            continue;
        }
        finalFields.push(createListFilters({ model, field, plugins: fieldTypePlugins }));
    }

    return finalFields.filter(Boolean).join("\n");
};
