import { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types";
import { Folder } from "~/folder/folder.types";
import { ROOT_FOLDER } from "./constants";
import { isPageModel } from "~/utils/decorators/isPageModel";

interface Params {
    model: CmsModel;
    where: CmsEntryListWhere | undefined;
    folders: Folder[];
}

/**
 * There are multiple cases that we need to handle:
 * * existing location with no AND conditional
 * * existing location with AND conditional
 * * no existing location with no AND conditional + with AND conditional
 */
export const createWhere = (params: Params): CmsEntryListWhere | undefined => {
    const { model, where, folders } = params;

    // Once we migrate PB to HCMS, we can remove this check and always use `wbAco_location`.
    const locationFieldName = isPageModel(model) ? "location" : "wbyAco_location";

    const whereLocation = {
        [locationFieldName]: {
            // At the moment, all users can access entries in the root folder.
            // Root folder level permissions cannot be set yet.
            folderId_in: [ROOT_FOLDER, ...folders.map(folder => folder.id)]
        }
    };

    if (!where) {
        // If no `where` condition is present, that means we're performing a query
        // across all folders. Still, with FLP enabled, we need to filter out
        // folders to which the user does not have access.
        return whereLocation;
    }

    const whereAnd = where.AND;
    if (where[locationFieldName] && !whereAnd) {
        return {
            ...where,
            AND: [
                {
                    ...whereLocation
                }
            ]
        };
    } else if (where[locationFieldName] && whereAnd) {
        return {
            ...where,
            AND: [
                {
                    ...whereLocation
                },
                ...whereAnd
            ]
        };
    }

    return {
        ...where,
        ...whereLocation
    };
};
