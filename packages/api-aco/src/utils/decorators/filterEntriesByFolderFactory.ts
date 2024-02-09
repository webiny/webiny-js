import { AcoContext } from "~/types";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { FolderLevelPermissions } from "~/utils/FolderLevelPermissions";
import { ROOT_FOLDER } from "./constants";

type Context = Pick<AcoContext, "aco" | "cms">;

import { createFolderType } from "./createFolderType";

export const filterEntriesByFolderFactory = (
    context: Context,
    permissions: FolderLevelPermissions
) => {
    return async (model: CmsModel, entries: CmsEntry[]) => {
        const [folders] = await context.aco.folder.listAll({
            where: {
                type: createFolderType(model)
            }
        });

        const results = await Promise.all(
            entries.map(async entry => {
                const folderId = entry.location?.folderId;
                if (!folderId || folderId === ROOT_FOLDER) {
                    return entry;
                }

                const folder = folders.find(folder => folder.id === folderId);
                if (!folder) {
                    throw new NotFoundError(`Folder "${folderId}" not found.`);
                }
                const result = await permissions.canAccessFolderContent({
                    folder,
                    rwd: "r"
                });
                return result ? entry : null;
            })
        );

        return results.filter((entry): entry is CmsEntry => !!entry);
    };
};
