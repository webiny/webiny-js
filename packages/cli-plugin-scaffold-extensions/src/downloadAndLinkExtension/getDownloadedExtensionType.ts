import loadJson from "load-json-file";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";
import path from "node:path";

export const getDownloadedExtensionType = async (downloadedExtensionRootPath: string) => {
    const pkgJsonPath = path.join(downloadedExtensionRootPath, "package.json");
    const pkgJson = await loadJson<PackageJson>(pkgJsonPath);

    const keywords = pkgJson.keywords;
    if (Array.isArray(keywords)) {
        for (const keyword of keywords) {
            if (keyword.startsWith("webiny-extension-type:")) {
                return keyword.replace("webiny-extension-type:", "");
            }
        }
    }

    return null;
};
