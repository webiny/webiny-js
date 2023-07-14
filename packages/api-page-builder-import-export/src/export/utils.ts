import { File } from "@webiny/api-file-manager/types";

export function extractFilesFromData(data: Record<string, any>, files: File[] = []) {
    if (!data || typeof data !== "object") {
        return files;
    }

    // Recursively call function for each element
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            extractFilesFromData(element, files);
        }
        return files;
    }

    // Main
    const tuple = Object.entries(data);
    for (let i = 0; i < tuple.length; i++) {
        const [key, value] = tuple[i];
        if (key === "file" && value) {
            files.push(value);
        } else if (key === "images" && Array.isArray(value)) {
            // Handle case for "images-list" component
            files.push(...value);
        } else {
            extractFilesFromData(value, files);
        }
    }
    return files;
}
