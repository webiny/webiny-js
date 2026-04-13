import { immutableDelete, immutableSet } from "@webiny/utils/dotProp/index.js";
import type { CmsModelField, CmsModel } from "~/types.js";
import type { CmsEditorLayoutCell } from "@webiny/app-headless-cms-common/types/model.js";

type DeleteFieldParamsData = Pick<CmsModel, "fields" | "layout">;
interface DeleteFieldParams {
    field: Pick<CmsModelField, "id">;
    data: DeleteFieldParamsData;
}
export default (params: DeleteFieldParams) => {
    const { field, data: prev } = params;
    // Remove the field from fields list...
    const fieldIndex = prev.fields.findIndex(item => item.id === field.id);
    const data = immutableDelete(prev, `fields.${fieldIndex}`) as DeleteFieldParamsData;

    // ...and rebuild the layout object, preserving layout descriptors.
    return immutableSet(data, "layout", (layout: DeleteFieldParamsData["layout"]) => {
        if (!layout) {
            return [];
        }
        const newLayout: CmsEditorLayoutCell[][] = [];
        let currentRowIndex = 0;
        layout.forEach(row => {
            row.forEach(cell => {
                // Preserve layout descriptors (objects) as-is
                if (typeof cell !== "string") {
                    if (!Array.isArray(newLayout[currentRowIndex])) {
                        newLayout[currentRowIndex] = [];
                    }
                    newLayout[currentRowIndex].push(cell);
                    return;
                }
                const field = data.fields.find(item => item.id === cell);
                if (!field) {
                    return;
                }
                if (!Array.isArray(newLayout[currentRowIndex])) {
                    newLayout[currentRowIndex] = [];
                }

                newLayout[currentRowIndex].push(cell);
            });
            newLayout[currentRowIndex] && newLayout[currentRowIndex].length && currentRowIndex++;
        });

        return newLayout;
    });
};
