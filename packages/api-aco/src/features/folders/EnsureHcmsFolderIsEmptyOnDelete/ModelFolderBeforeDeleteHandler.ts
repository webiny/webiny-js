import { WebinyError } from "@webiny/error";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderBeforeDeleteHandler } from "~/features/folders/DeleteFolder/abstractions.js";
import type { FolderBeforeDeleteEvent } from "~/features/folders/DeleteFolder/events.js";
import { ensureFolderIsEmpty } from "~/folder/ensureFolderIsEmpty.js";
import type { AcoContext } from "~/types.js";

export class ModelFolderBeforeDeleteHandler implements FolderBeforeDeleteHandler.Interface {
    constructor(private context: AcoContext) {}

    async handle(event: FolderBeforeDeleteEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            const { id, type } = folder;

            const modelId = type.split(":")[1];
            if (!modelId) {
                return;
            }

            let model: CmsModel;
            try {
                model = await this.context.cms.getModel(modelId);
                if (!model) {
                    return;
                }
            } catch {
                return;
            }

            await ensureFolderIsEmpty({
                context: this.context,
                folder,
                hasContentCallback: async () => {
                    const [content] = await this.context.cms.listEntries(model!, {
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
                message: "Error while ensuring HCMS folder is empty before delete.",
                code: "ACO_BEFORE_FOLDER_DELETE_HCMS_HANDLER"
            });
        }
    }
}
