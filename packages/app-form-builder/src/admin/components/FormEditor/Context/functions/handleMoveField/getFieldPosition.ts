import { FbFormModelField, FieldIdType, FieldLayoutPositionType } from "~/types";

interface GetFieldPositionResult extends Omit<FieldLayoutPositionType, "index"> {
    index: number;
}
interface GetFieldPositionParams {
    field: FbFormModelField | FieldIdType;
    layout: string[][];
}

export default ({ field, layout }: GetFieldPositionParams): GetFieldPositionResult | null => {
    const id = typeof field === "string" ? field : field._id;
    for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
        const row = layout[rowIndex];
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
