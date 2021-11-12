import { CmsFieldTypePlugins, CmsContentModel } from "~/types";
import get from "lodash/get";

interface RenderListFilterFields {
    (params: {
        model: CmsContentModel;
        type: "read" | "manage";
        fieldTypePlugins: CmsFieldTypePlugins;
    }): string;
}

export const renderListFilterFields: RenderListFilterFields = ({
    model,
    type,
    fieldTypePlugins
}) => {
    const fields: string[] = [
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

    for (let i = 0; i < model.fields.length; i++) {
        const field = model.fields[i];
        // Every time a client updates content model's fields, we check the type of each field. If a field plugin
        // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
        // want to be careful when accessing the field plugin here too. It is still possible to have a content model
        // that contains a field, for which we don't have a plugin registered on the backend. For example, user
        // could've just removed the plugin from the backend.
        const createListFilters = get(fieldTypePlugins, `${field.type}.${type}.createListFilters`);
        if (typeof createListFilters === "function") {
            fields.push(createListFilters({ model, field }));
        }
    }

    return fields.filter(Boolean).join("\n");
};
