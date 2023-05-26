import dot from "dot-prop-immutable";
import { CmsModelField, CmsModel } from "~/types";

type DeleteFieldParamsData = Pick<CmsModel, "fields" | "layout">;
interface DeleteFieldParams {
    field: Pick<CmsModelField, "id">;
    data: DeleteFieldParamsData;
}
export default (params: DeleteFieldParams) => {
    const { field, data: prev } = params;
    // Remove the field from fields list...
    const fieldIndex = prev.fields.findIndex(item => item.id === field.id);
    const data = dot.delete(prev, `fields.${fieldIndex}`) as DeleteFieldParamsData;

    // ...and rebuild the layout object.
    return dot.set(data, "layout", (layout: DeleteFieldParamsData["layout"]) => {
        if (!layout) {
            return [];
        }
        const newLayout: DeleteFieldParamsData["layout"] = [];
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
