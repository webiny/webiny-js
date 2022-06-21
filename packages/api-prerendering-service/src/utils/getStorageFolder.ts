export const getStorageFolder = (path: string) => {
    if (path.startsWith("/")) {
        path = path.substring(1);
    }

    return path;
};
