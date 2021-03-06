import { CmsFieldTypePlugins, CmsContentModel, CmsModelFieldDefinition } from "../../../types";

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
                // Let's not render the field if it does not exist in the field plugins.
                return;
            }
            const defs = fieldTypePlugins[f.type][type].createTypeField({ model, field: f });

            if (typeof defs === "string") {
                return { fields: defs };
            }

            return defs;
        })
        .filter(Boolean);
};
