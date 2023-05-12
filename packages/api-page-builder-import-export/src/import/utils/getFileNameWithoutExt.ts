import path from "path";

export function getFileNameWithoutExt(fileName: string): string {
    return path.basename(fileName).replace(path.extname(fileName), "");
}
