import loadJson from "load-json-file";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";
import path from "node:path";

export const getDownloadedExtensionType = async (downloadedExtensionRootPath: string) => {
    const pkgJsonPath = path.join(downloadedExtensionRootPath, "package.json");
    const pkgJson = await loadJson<PackageJson>(pkgJsonPath);

    const keywords = pkgJson.keywords;
    // If there is no keywords, we consider the folder to be a workspace.
    if (!Array.isArray(keywords)) {
        return "workspace";
    }

    for (const keyword of keywords) {
        if (keyword.startsWith("webiny-extension-type:")) {
            return keyword.replace("webiny-extension-type:", "");
        }
    }

    throw new Error(`Could not determine the extension type from the downloaded extension.`);
};
