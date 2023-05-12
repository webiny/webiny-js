import path from "path";
import { Package } from "./types";
import { CACHE_FOLDER_PATH } from "./constants";

export function getPackageCacheFolderPath(workspacePackage: Package) {
    return path.join(CACHE_FOLDER_PATH, workspacePackage.packageJson.name);
}
