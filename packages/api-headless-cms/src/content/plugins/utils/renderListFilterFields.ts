import { CmsFieldTypePlugins, CmsContentModel } from "@webiny/api-headless-cms/types";

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
            "id_in: [ID]",
            "id_not_in: [ID]",
            "createdOn: DateTime",
            "createdOn_gt: DateTime",
            "createdOn_gte: DateTime",
            "createdOn_lt: DateTime",
            "createdOn_lte: DateTime",
            "createdOn_between: [DateTime]",
            "createdOn_not_between: [DateTime]",
            "savedOn: DateTime",
            "savedOn_gt: DateTime",
            "savedOn_gte: DateTime",
            "savedOn_lt: DateTime",
            "savedOn_lte: DateTime",
            "savedOn_between: [DateTime]",
            "savedOn_not_between: [DateTime]"
        ].join("\n")
    ];

    for (let i = 0; i < model.fields.length; i++) {
        const field = model.fields[i];
        const { createListFilters } = fieldTypePlugins[field.type][type];
        if (typeof createListFilters === "function") {
            fields.push(createListFilters({ model, field }));
        }
    }

    return fields.filter(Boolean).join("\n");
};
