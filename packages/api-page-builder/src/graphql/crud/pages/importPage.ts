import path from "path";
import loadJson from "load-json-file";
import kebabCase from "lodash/kebabCase";
import {
    getFileNameByExtension,
    uploadPageAssets
} from "~/graphql/crud/install/utils/savePageAssets";
import { PbContext } from "~/graphql/types";
import {
    deleteFile,
    downloadAndExtractZip
} from "~/graphql/crud/install/utils/downloadInstallFiles";

interface ImportPageParams {
    context: PbContext;
    pageDataZipKey: string;
    pageDataZipUrl: string;
    pageTitle: string;
}

const importPage = async ({
    context,
    pageDataZipKey,
    pageDataZipUrl,
    pageTitle
}: ImportPageParams) => {
    const title = kebabCase(pageTitle);

    const PAGE_DATA_EXTRACT_DIR = await downloadAndExtractZip({
        zipFileKey: pageDataZipKey,
        downloadZipAs: `${title}.zip`,
        extractZipInDir: title,
        zipFileUrl: pageDataZipUrl
    });

    // Load the data file
    const pageDataFilePath = getFileNameByExtension(PAGE_DATA_EXTRACT_DIR, ".json");
    console.log("File loaded => ", pageDataFilePath);
    const { page, files } = await loadJson<Record<string, any>>(
        path.join(PAGE_DATA_EXTRACT_DIR, pageDataFilePath)
    );
    const assetsDirName = path.join(PAGE_DATA_EXTRACT_DIR, "assets");
    const { fileIdToKeyMap } = await uploadPageAssets({
        context,
        assetsDirName,
        assetDataKey: "key",
        keyPrefix: title,
        fileData: files
    });
    // To be sure
    await deleteFile(PAGE_DATA_EXTRACT_DIR);

    // Only update page data if there are files
    if (Array.isArray(files) && files.length) {
        const { srcPrefix } = await context.fileManager.settings.getSettings();
        updateFilesInPageData({ data: page.content, fileIdToKeyMap, srcPrefix });
    }

    return page;
};

export default importPage;

interface UpdateFilesInPageDataParams {
    data: Record<string, any>;
    fileIdToKeyMap: Record<string, string>;
    srcPrefix: string;
}

export function updateFilesInPageData({
    data,
    fileIdToKeyMap,
    srcPrefix
}: UpdateFilesInPageDataParams) {
    // BASE CASE: Termination point
    if (!data || typeof data !== "object") {
        return;
    }
    // Recursively call function if data is array
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            updateFilesInPageData({ data: element, fileIdToKeyMap, srcPrefix });
        }
        return;
    }
    // Main logic
    const tuple = Object.entries(data);
    for (let i = 0; i < tuple.length; i++) {
        const [key, value] = tuple[i];

        if (key === "file" && value && fileIdToKeyMap[value.id]) {
            value.key = fileIdToKeyMap[value.id];
            value.name = fileIdToKeyMap[value.id];
            value.src = `${srcPrefix}${srcPrefix.endsWith("/") ? "" : "/"}${
                fileIdToKeyMap[value.id]
            }`;
        } else {
            updateFilesInPageData({ data: value, srcPrefix, fileIdToKeyMap });
        }
    }
}
