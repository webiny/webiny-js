import { CmsFieldTypePlugins, CmsContentModel } from "../../../types";
import get from "lodash/get";

interface RenderInputFields {
    (params: { model: CmsContentModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderInputFields: RenderInputFields = ({ model, fieldTypePlugins }) => {
    return model.fields
        .map(f => {
            // Every time a client updates content model's fields, we check the type of each field. If a field plugin
            // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
            // want to be careful when accessing the field plugin here too. It is still possible to have a content model
            // that contains a field, for which we don't have a plugin registered on the backend. For example, user
            // could've just removed the plugin from the backend.
            const createInputField = get(fieldTypePlugins, `${f.type}.manage.createInputField`);
            if (createInputField) {
                return createInputField({ model, field: f });
            }

            return null;
        })
        .filter(Boolean)
        .join("\n");
};
