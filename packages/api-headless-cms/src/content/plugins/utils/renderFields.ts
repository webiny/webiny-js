import {
    CmsFieldTypePlugins,
    CmsContentModel,
    CmsModelFieldDefinition
} from "@webiny/api-headless-cms/types";

interface RenderFields {
    (params: {
        model: CmsContentModel;
        type: string;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): CmsModelFieldDefinition[];
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
            const defs = fieldTypePlugins[f.type][type].createTypeField({ model, field: f });

            if (typeof defs === "string") {
                return { fields: defs };
            }

            return defs;
        })
        .filter(Boolean);
};
