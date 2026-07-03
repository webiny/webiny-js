export interface TableRow<TData = unknown> {
    id: string;
    $selectable: boolean;
    $type: string;
    data: TData;
}

export interface RecordTableRow<TData> extends TableRow<TData> {
    $type: "RECORD";
}
