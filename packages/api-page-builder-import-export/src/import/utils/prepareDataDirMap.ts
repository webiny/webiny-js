import dotProp from "dot-prop-immutable";
import { ImportData } from "~/types";
import { ASSETS_DIR_NAME } from "~/import/constants";

export function prepareDataDirMap({
    map,
    filePath,
    newKey
}: {
    map: ImportData;
    filePath: string;
    newKey: string;
}): ImportData {
    const isAsset = filePath.includes(ASSETS_DIR_NAME);

    if (isAsset) {
        /*
         * We want to use dot (.) as part of object key rather than creating nested object(s).
         * Also, the file name might contain dots in it beside the extension, so, we are escaping them all.
         */
        const assetKey = filePath.split(`${ASSETS_DIR_NAME}/`).pop() as string;
        const oldKey = assetKey.replace(/\./g, "\\.");

        map = dotProp.set(map, `assets.${oldKey}`, newKey);
    } else {
        // We only need to know the newKey for data file.
        map = dotProp.set(map, `data`, newKey);
    }

    return map;
}
