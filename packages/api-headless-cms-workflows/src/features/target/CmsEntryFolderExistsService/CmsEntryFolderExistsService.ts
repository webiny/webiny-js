import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { getModelIdFromFolderType } from "~/utils/folderType.js";
import { isBindableModel } from "~/utils/isBindableModel.js";
import { CmsEntryFolderExistsService as Abstraction } from "./abstractions.js";

const UNREADABLE_MODEL_CODES = ["Cms/Model/NotFound", "Cms/Model/NotAuthorized"];
const FOLDER_NOT_FOUND = "Aco/Folder/NotFound";

/**
 * The model is read as the current identity (the editor), so the answer never covers a model
 * they cannot bind (D116); the folder through ACO's repository, which applies no folder-level
 * permissions (D69).
 */
class CmsEntryFolderExistsServiceImpl implements Abstraction.Interface {
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private getFolder: GetFolderRepository.Interface
    ) {}

    public async exists(params: Abstraction.Params): Promise<boolean> {
        // The ACO repository reads "<id>#<n>" as a revision; such an id is never a folder.
        if (!params.id || params.id.includes("#")) {
            return false;
        }
        const modelId = getModelIdFromFolderType(params.type);
        if (!modelId) {
            return false;
        }

        const model = await this.getModel.execute(modelId);
        if (model.isFail()) {
            if (UNREADABLE_MODEL_CODES.includes(model.error.code)) {
                return false;
            }
            throw model.error;
        }
        if (!isBindableModel(model.value)) {
            return false;
        }

        const folder = await this.getFolder.execute(params.id);
        if (folder.isFail()) {
            if (folder.error.code === FOLDER_NOT_FOUND) {
                return false;
            }
            throw folder.error;
        }
        return folder.value.type === params.type;
    }
}

export const CmsEntryFolderExistsService = Abstraction.createImplementation({
    implementation: CmsEntryFolderExistsServiceImpl,
    dependencies: [GetModelUseCase, GetFolderRepository]
});
