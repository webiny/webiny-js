import { CmsFieldTypePlugins, CmsContentModel } from "@webiny/api-headless-cms/types";

interface RenderFields {
    (params: {
        model: CmsContentModel;
        type: string;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): string;
}

export const renderFields: RenderFields = ({ model, type, fieldTypePlugins }) => {
    return model.fields
        .map(f => {
            const plugin = fieldTypePlugins[f.type];
            if (!plugin) {
                throw Error(
                    `Missing "cms-model-field-to-graphql" plugin for field type "${f.type}"`
                );
            }
            return fieldTypePlugins[f.type][type].createTypeField({ model, field: f });
        })
        .filter(Boolean)
        .join("\n");
};
