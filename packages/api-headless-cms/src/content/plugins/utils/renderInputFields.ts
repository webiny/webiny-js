import { CmsFieldTypePlugins, CmsContentModelType } from "@webiny/api-headless-cms/types";

interface RenderInputFields {
    (params: { model: CmsContentModelType; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderInputFields: RenderInputFields = ({ model, fieldTypePlugins }) => {
    return model.fields
        .map(f => {
            return fieldTypePlugins[f.type].manage.createInputField({ model, field: f });
        })
        .join("\n");
};
