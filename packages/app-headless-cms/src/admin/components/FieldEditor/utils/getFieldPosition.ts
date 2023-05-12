import { CmsModelField, CmsModel, FieldLayoutPosition } from "~/types";

interface GetFieldPositionParams {
    field: string | CmsModelField;
    data: Pick<CmsModel, "layout">;
}
export default (params: GetFieldPositionParams): FieldLayoutPosition | null => {
    const { field, data } = params;
    const id = typeof field === "string" ? field : field.id;
    const layout = data.layout ? data.layout : [];
    for (let i = 0; i < layout.length; i++) {
        const row = layout[i];
        for (let j = 0; j < row.length; j++) {
            if (row[j] === id) {
                return { row: i, index: j };
            }
        }
    }

    return null;
};
