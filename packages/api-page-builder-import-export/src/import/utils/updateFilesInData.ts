import { FileInput } from "@webiny/api-file-manager/types";

interface UpdateFilesInDataParams {
    data: Record<string, any>;
    fileIdToNewFileMap: Map<string, FileInput>;
    srcPrefix: string;
}

export function updateFilesInData({
    data,
    fileIdToNewFileMap,
    srcPrefix
}: UpdateFilesInDataParams) {
    if (!data || typeof data !== "object") {
        return;
    }
    // Recursively call function if data is an array.
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            updateFilesInData({ data: element, fileIdToNewFileMap, srcPrefix });
        }
        return;
    }
    // Main logic
    const tuple = Object.entries(data);
    for (let i = 0; i < tuple.length; i++) {
        const [key, value] = tuple[i];

        if (key === "file" && value && fileIdToNewFileMap.has(value.id)) {
            const newFile = fileIdToNewFileMap.get(value.id);
            if (!newFile) {
                continue;
            }

            const cleanSrcPrefix = srcPrefix.endsWith("/") ? srcPrefix.slice(0, -1) : srcPrefix;

            value.id = newFile.id;
            value.key = newFile.key;
            value.name = newFile.name;
            value.src = `${cleanSrcPrefix}/${newFile.key}`;
        } else {
            updateFilesInData({ data: value, srcPrefix, fileIdToNewFileMap });
        }
    }
}
