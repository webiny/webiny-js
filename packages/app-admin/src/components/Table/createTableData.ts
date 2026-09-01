import type { RecordTableRow } from "./table.types.js";

export const createRecordsData = <T extends { id: string; $selectable?: boolean }>(
    items: T[]
): RecordTableRow<T>[] => {
    return items.map(item => ({
        id: item.id,
        $type: "RECORD",
        $selectable: item.$selectable !== undefined ? item.$selectable : true,
        data: item
    }));
};
