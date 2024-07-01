import { FileItem } from "@webiny/app-admin/types";
import minimatch from "minimatch";

export const getThumbnailRenderer = <T extends { type: string }>(
    renderers: T[],
    file: FileItem
): T => {
    // Sort by type and by priority. More occurrences of `*` means lower priority.
    const regExMatch = /\*/g;

    const types = renderers.sort((a, b) => {
        const countA = (a.type.match(regExMatch) || []).length;
        const countB = (b.type.match(regExMatch) || []).length;
        if (countB > countA) {
            return -1;
        } else if (countB < countA) {
            return 1;
        }
        return 0;
    });

    // Find first matching type
    const renderer = types.find(type => minimatch(file.type, type.type));

    return renderer!;
};
