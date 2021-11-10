import { CmsFieldTypePlugins, CmsContentModel } from "~/types";
import get from "lodash/get";

interface RenderSortEnum {
    (params: { model: CmsContentModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderSortEnum: RenderSortEnum = ({ model, fieldTypePlugins }) => {
    const sorters = [
        `id_ASC`,
        `id_DESC`,
        "savedOn_ASC",
        "savedOn_DESC",
        "createdOn_ASC",
        "createdOn_DESC"
    ];

    const fieldIds = model.fields
        .filter(f => {
            // Every time a client updates content model's fields, we check the type of each field. If a field plugin
            // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
            // want to be careful when accessing the field plugin here too. It is still possible to have a content model
            // that contains a field, for which we don't have a plugin registered on the backend. For example, user
            // could've just removed the plugin from the backend.
            return get(fieldTypePlugins, `${f.type}.isSortable`);
        })
        .map(f => f.fieldId);

    fieldIds.forEach(fieldId => {
        sorters.push(`${fieldId}_ASC`);
        sorters.push(`${fieldId}_DESC`);
    });

    return sorters.join("\n");
};
