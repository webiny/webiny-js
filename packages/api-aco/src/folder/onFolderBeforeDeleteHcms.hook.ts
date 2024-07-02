import WebinyError from "@webiny/error";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { AcoContext } from "~/types";
import { ensureFolderIsEmpty } from "~/folder/ensureFolderIsEmpty";

export const onFolderBeforeDeleteHcmsHook = (context: AcoContext) => {
    context.aco.folder.onFolderBeforeDelete.subscribe(async ({ folder }) => {
        try {
            const { id, type } = folder;

            const modelId = type.split(":")[1];
            if (!modelId) {
                return;
            }

            let model: CmsModel
            try {
                model = await context.cms.getModel(modelId);
                if (!model) {
                    return;
                }
            } catch {
                return;
            }

            await ensureFolderIsEmpty({
                context,
                folder,
                hasContentCallback: async () => {
                    const [content] = await context.cms.listEntries(model!, {
                        where: {
                            latest: true,
                            wbyAco_location: {
                                folderId: id
                            }
                        },
                        limit: 1
                    });
                    return content.length > 0;
                }
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFolderBeforeDeleteHcmsHook hook.",
                code: "ACO_BEFORE_FOLDER_DELETE_HCMS_HOOK"
            });
        }
    });
};
