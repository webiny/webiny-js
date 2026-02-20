import { loadJsonFileSync } from "load-json-file";
import type { MetaJSON } from "./types";
import { META_FILE_PATH } from "./constants";

export function getBuildMeta() {
    let metaJson: MetaJSON = { packages: {} };
    try {
        metaJson = loadJsonFileSync(META_FILE_PATH);
    } catch {
        // An error means there's no meta file, so we start a fresh build.
    }

    return metaJson;
}
