import isPlainObject from "lodash/isPlainObject.js";
import { isPageModel } from "./isPageModel.js";
import type { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ROOT_FOLDER } from "~/constants.js";

interface Params {
    model: CmsModel;
    where: CmsEntryListWhere | undefined;
}

export const hasRootFolderId = ({ model, where }: Params): boolean => {
    if (!where) {
        return false;
    }

    const key = isPageModel(model) ? "location" : "wbyAco_location";
    const location = where[key];

    if (typeof location === "object" && location !== null && isPlainObject(location)) {
        return (location as Record<string, any>).folderId === ROOT_FOLDER;
    }

    return false;
};
