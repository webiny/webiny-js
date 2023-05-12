import { ImportExportTaskStatus } from "~/types";

export function initialStats(total: number) {
    return {
        [ImportExportTaskStatus.PENDING]: total,
        [ImportExportTaskStatus.PROCESSING]: 0,
        [ImportExportTaskStatus.COMPLETED]: 0,
        [ImportExportTaskStatus.FAILED]: 0,
        total
    };
}
