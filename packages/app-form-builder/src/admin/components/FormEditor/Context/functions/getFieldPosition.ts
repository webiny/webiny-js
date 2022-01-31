import { FbFormModel, FbFormModelField, FieldLayoutPositionType } from "~/types";

interface Params {
    field: FbFormModelField | string;
    data: FbFormModel;
}
export default ({ field, data }: Params): FieldLayoutPositionType => {
    const id = typeof field === "string" ? field : field._id;
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
