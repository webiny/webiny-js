export interface IGetFilePathResult {
    path: string;
    filename: string;
}

export const getFilePath = (file: string): IGetFilePathResult => {
    const parts = file.split("/").filter(Boolean);
    if (parts.length === 1) {
        return {
            path: "",
            filename: parts.join("/")
        };
    }
    const filename = parts.pop() as string;
    return {
        path: parts.join("/"),
        filename
    };
};
