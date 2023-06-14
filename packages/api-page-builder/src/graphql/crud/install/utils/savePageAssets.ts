import loadJson from "load-json-file";
import fs from "fs-extra";
import path from "path";
import { File } from "@webiny/api-file-manager/types";
import downloadInstallationFiles from "./downloadInstallFiles";
import { PbContext } from "~/graphql/types";
import { FileStorageUploadParams } from "@webiny/api-file-manager/storage/FileStorage";

/**
 * Type comes from installation/files/data/pagesFilesData.json
 */
interface PageFilesData {
    id: string;
    name: string;
    key: string;
    size: number;
    type: string;
    meta: {
        private: boolean;
    };
    __physicalFileName: string;
}

interface SavePageAssetsParams {
    context: PbContext;
}
export const savePageAssets = async ({
    context
}: SavePageAssetsParams): Promise<Record<string, File>> => {
    if (process.env.NODE_ENV === "test") {
        return {};
    }

    const INSTALL_EXTRACT_DIR = await downloadInstallationFiles();

    const pagesFilesData = await loadJson<PageFilesData[]>(
        path.join(INSTALL_EXTRACT_DIR, "data/pagesFilesData.json")
    );

    try {
        const filesToUpload = pagesFilesData.map<FileStorageUploadParams>(file => {
            const buffer = fs.readFileSync(
                path.join(INSTALL_EXTRACT_DIR, "images/", file.__physicalFileName)
            );

            return {
                buffer,
                id: file.id,
                key: file.key,
                name: file.name,
                size: buffer.length,
                type: file.type,
                hideInFileManager: Boolean(file.meta.private),
                keyPrefix: "demo-pages"
            };
        });

        // Upload file to File Manager.
        const files = await context.fileManager.storage.uploadFiles({ files: filesToUpload });

        return files.reduce((acc, file) => ({ ...acc, [file.id]: file }), {});
    } catch (e) {
        console.error(e);
        console.error(`[savePageAssets]: ${e.stack}`);
    }
    return {};
};
