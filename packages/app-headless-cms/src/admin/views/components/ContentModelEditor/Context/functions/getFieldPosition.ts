import { FieldLayoutPosition } from "~/types";

export default ({ field, data }): FieldLayoutPosition => {
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
