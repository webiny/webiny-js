import { IMPORT_BASE_PATH } from "~/tasks/constants";

export const stripImportPath = (key: string): string => {
    return key.replace(IMPORT_BASE_PATH, "").replace(/^\/+/, "");
};

export const prependImportPath = (key: string): string => {
    return `${IMPORT_BASE_PATH}/${key.replace(/^\/+/, "")}`;
};
