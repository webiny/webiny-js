import { File } from "~/types";

export interface ImageFile extends File {
    key: string;
}

export function extractFilesFromPageData(
    data: Record<string, any>,
    files: any[] = []
): ImageFile[] {
    // Base case: termination
    if (!data || typeof data !== "object") {
        return files;
    }
    // Recursively call function for each element
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            extractFilesFromPageData(element, files);
        }
        return files;
    }

    // Main
    const tuple = Object.entries(data);
    for (let i = 0; i < tuple.length; i++) {
        const [key, value] = tuple[i];
        if (key === "file" && value) {
            files.push(value);
        } else {
            extractFilesFromPageData(value, files);
        }
    }
    return files;
}
