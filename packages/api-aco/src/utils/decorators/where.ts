import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { Folder } from "~/folder/folder.types";
import { ROOT_FOLDER } from "./constants";

interface Params {
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
    const { where, folders } = params;
    if (!where) {
        return undefined;
    }
    const whereLocation = {
        wbyAco_location: {
            // At the moment, all users can access entries in the root folder.
            // Root folder level permissions cannot be set yet.
            folderId_in: [ROOT_FOLDER, ...folders.map(folder => folder.id)]
        }
    };
    const whereAnd = where.AND;
    if (where.wbyAco_location && !whereAnd) {
        return {
            ...where,
            AND: [
                {
                    ...whereLocation
                }
            ]
        };
    } else if (where.wbyAco_location && whereAnd) {
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
