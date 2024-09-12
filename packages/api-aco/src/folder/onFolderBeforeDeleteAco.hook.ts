import WebinyError from "@webiny/error";
import { AcoContext, SearchRecord } from "~/types";
import { ensureFolderIsEmpty } from "~/folder/ensureFolderIsEmpty";

export const onFolderBeforeDeleteAcoHook = (context: AcoContext) => {
    context.aco.folder.onFolderBeforeDelete.subscribe(async ({ folder }) => {
        try {
            const { id, type } = folder;

            await ensureFolderIsEmpty({
                context,
                folder,
                hasContentCallback: async () => {
                    const content: SearchRecord[] = [];
                    try {
                        const app = context.aco.getApp(type);
                        if (app) {
                            const [acoSearchRecords] = await app.search.list({
                                where: {
                                    type,
                                    location: {
                                        folderId: id
                                    }
                                },
                                limit: 1
                            });
                            content.push(...acoSearchRecords);
                        }
                    } catch {
                        // Do nothing.
                    }

                    return content.length > 0;
                }
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFolderBeforeDeleteAcoHook hook.",
                code: "ACO_BEFORE_FOLDER_DELETE_ACO_HOOK"
            });
        }
    });
};
