import { FbFormModel, FbFormModelField, FieldIdType, FieldLayoutPositionType } from "~/types";

interface Params {
    field: FbFormModelField | FieldIdType;
    data: FbFormModel;
}
export default ({ field, data }: Params): FieldLayoutPositionType | null => {
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
