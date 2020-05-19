import { CmsFieldTypePlugins, CmsContentModel } from "@webiny/api-headless-cms/types";

interface RenderGetFilterFields {
    (params: { model: CmsContentModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderGetFilterFields: RenderGetFilterFields = ({ model, fieldTypePlugins }) => {
    const fields = model.fields
        .map(field => {
            const { createGetFilters } = fieldTypePlugins[field.type]["read"];
            if (typeof createGetFilters === "function") {
                return createGetFilters({ model, field });
            }
        })
        .filter(Boolean);

    fields.unshift(`id: ID${fields.length > 0 ? "" : "!"}`);

    return fields.join("\n");
};
