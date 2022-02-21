import dot from "dot-prop-immutable";
import { CmsEditorField, CmsModel } from "~/types";

type Data = Pick<CmsModel, "fields" | "layout">;
interface Params {
    field: CmsEditorField;
    data: Data;
}
export default (params: Params) => {
    const { field, data: prev } = params;
    // Remove the field from fields list...
    const fieldIndex = prev.fields.findIndex(item => item.id === field.id);
    const data = dot.delete(prev, `fields.${fieldIndex}`) as Data;

    // ...and rebuild the layout object.
    return dot.set(data, "layout", (layout: Data["layout"]) => {
        const newLayout: Data["layout"] = [];
        let currentRowIndex = 0;
        layout.forEach(row => {
            row.forEach(fieldId => {
                const field = data.fields.find(item => item.id === fieldId);
                if (!field) {
                    return;
                }
                if (!Array.isArray(newLayout[currentRowIndex])) {
                    newLayout[currentRowIndex] = [];
                }

                newLayout[currentRowIndex].push(fieldId);
            });
            newLayout[currentRowIndex] && newLayout[currentRowIndex].length && currentRowIndex++;
        });

        return newLayout;
    });
};
