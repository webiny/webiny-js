import { EXPORT_BASE_PATH } from "~/tasks/constants";

export const stripExportPath = (key: string): string => {
    return key.replace(EXPORT_BASE_PATH, "").replace(/^\/+/, "");
};

export const prependExportPath = (key: string): string => {
    return `${EXPORT_BASE_PATH}/${key.replace(/^\/+/, "")}`;
};
