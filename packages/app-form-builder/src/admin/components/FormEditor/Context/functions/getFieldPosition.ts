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
    for (let rowIndex = 0; rowIndex < data.layout.length; rowIndex++) {
        const row = data.layout[rowIndex];
        for (let fieldIndex = 0; fieldIndex < row.length; fieldIndex++) {
            if (row[fieldIndex] !== id) {
                continue;
            }
            return {
                row: rowIndex,
                index: fieldIndex
            };
        }
    }

    return null;
};
