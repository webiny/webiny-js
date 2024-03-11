export const EXPORT_PAGES_FOLDER_KEY = "WEBINY_PB_EXPORT_PAGES";

export const createExportPagesDataKey = (taskId: string) => {
    return `${EXPORT_PAGES_FOLDER_KEY}/${taskId}`;
};
