import WebinyError from "@webiny/error";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { AcoContext } from "~/types";

export const onFolderBeforeDeleteHcmsHook = (context: AcoContext) => {
    context.aco.folder.onFolderBeforeDelete.subscribe(async ({ folder }) => {
        try {
            const { id, type } = folder;

            const modelId = type.split(":")[1];

            if (!modelId) {
                return;
            }

            let model: CmsModel | null = null;
            try {
                model = await context.cms.getModel(modelId);

                if (!model) {
                    return;
                }
            } catch {
                return;
            }

            const [entries] = await context.cms.listEntries(model, {
                where: {
                    latest: true,
                    wbyAco_location: {
                        folderId: id
                    }
                },
                limit: 1
            });

            if (entries.length === 0) {
                return;
            }

            throw new WebinyError(
                "Delete all child folders and entries before proceeding.",
                "DELETE_FOLDER_WITH_CHILDREN",
                {
                    folder
                }
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFolderBeforeDeleteHcmsHook hook.",
                code: "ACO_BEFORE_FOLDER_DELETE_HCMS_HOOK"
            });
        }
    });
};
