import { CmsFieldTypePlugins, CmsContentModelType } from "@webiny/api-headless-cms/types";

interface RenderListFilterFields {
    (params: {
        model: CmsContentModelType;
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
        ["id: ID", "id_not: ID", "id_in: [ID]", "id_not_in: [ID]"].join("\n")
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
