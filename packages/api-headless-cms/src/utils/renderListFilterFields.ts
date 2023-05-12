import {
    ApiEndpoint,
    CmsFieldTypePlugins,
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin
} from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

interface RenderListFilterFieldsParams {
    model: CmsModel;
    fields: CmsModelField[];
    type: ApiEndpoint;
    fieldTypePlugins: CmsFieldTypePlugins;
}
interface RenderListFilterFields {
    (params: RenderListFilterFieldsParams): string;
}

type CreateListFiltersType =
    | CmsModelFieldToGraphQLPlugin["read"]["createListFilters"]
    | CmsModelFieldToGraphQLPlugin["manage"]["createListFilters"];

export const renderListFilterFields: RenderListFilterFields = (params): string => {
    const { model, fields, type, fieldTypePlugins } = params;
    const result: string[] = [
        [
            "id: ID",
            "id_not: ID",
            "id_in: [ID!]",
            "id_not_in: [ID!]",
            "entryId: String",
            "entryId_not: String",
            "entryId_in: [String!]",
            "entryId_not_in: [String!]",
            "createdOn: DateTime",
            "createdOn_gt: DateTime",
            "createdOn_gte: DateTime",
            "createdOn_lt: DateTime",
            "createdOn_lte: DateTime",
            "createdOn_between: [DateTime!]",
            "createdOn_not_between: [DateTime!]",
            "savedOn: DateTime",
            "savedOn_gt: DateTime",
            "savedOn_gte: DateTime",
            "savedOn_lt: DateTime",
            "savedOn_lte: DateTime",
            "savedOn_between: [DateTime!]",
            "savedOn_not_between: [DateTime!]",
            "createdBy: String",
            "createdBy_not: String",
            "createdBy_in: [String!]",
            "createdBy_not_in: [String!]",
            "ownedBy: String",
            "ownedBy_not: String",
            "ownedBy_in: [String!]",
            "ownedBy_not_in: [String!]"
        ].join("\n")
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
        result.push(createListFilters({ model, field, plugins: fieldTypePlugins }));
    }

    return result.filter(Boolean).join("\n");
};
