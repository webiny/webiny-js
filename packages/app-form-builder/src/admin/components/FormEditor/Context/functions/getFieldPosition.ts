import { FbFormModel, FbFormModelField, FieldIdType, FieldLayoutPositionType } from "~/types";

interface GetFieldPositionResult extends Omit<FieldLayoutPositionType, "index"> {
    index: number;
}
interface GetFieldPositionParams {
    field: FbFormModelField | FieldIdType;
    data: FbFormModel;
}

export default ({ field, data }: GetFieldPositionParams): GetFieldPositionResult | null => {
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
