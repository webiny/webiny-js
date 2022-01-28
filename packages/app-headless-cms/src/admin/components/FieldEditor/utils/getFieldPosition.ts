import { CmsEditorField, CmsModel, FieldLayoutPosition } from "~/types";

interface Params {
    field: string | CmsEditorField;
    data: Pick<CmsModel, "layout">;
}
export default (params: Params): FieldLayoutPosition => {
    const { field, data } = params;
    const id = typeof field === "string" ? field : field.id;
    for (let i = 0; i < data.layout.length; i++) {
        const row = data.layout[i];
        for (let j = 0; j < row.length; j++) {
            if (row[j] === id) {
                return { row: i, index: j };
            }
        }
    }

    return null;
};
