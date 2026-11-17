import { GetUniqueFieldValuesUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetUniqueFieldValues/abstractions.js";
import { createDecorator } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { FM_FILE_TYPE } from "~/constants.js";

/**
 * File Manager files are stored in the File Manager file model, but their folders use the "FmFile" type.
 */
const FM_FILE_MODEL_IDS = ["wbyFmFile", "fmFile"];

const getFolderType = (model: CmsModel): string => {
    if (FM_FILE_MODEL_IDS.includes(model.modelId)) {
        return FM_FILE_TYPE;
    }
    return `cms:${model.modelId}`;
};

/**
 * Security: unique values are aggregated in storage, so entries cannot be filtered afterwards.
 * Instead, entries located in folders the identity cannot read are excluded in the query.
 */
class GetUniqueFieldValuesWithFlpDecoratorImpl implements GetUniqueFieldValuesUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: GetUniqueFieldValuesUseCase.Interface
    ) {}

    async execute(
        model: CmsModel,
        params: GetUniqueFieldValuesUseCase.Params
    ): GetUniqueFieldValuesUseCase.Return {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute(model, params);
        }

        const deniedFolderIds = await this.listDeniedFolderIds(model);
        if (!deniedFolderIds.length) {
            return this.decoratee.execute(model, params);
        }

        const { AND, ...where } = params.where;
        return this.decoratee.execute(model, {
            ...params,
            where: {
                ...where,
                AND: [
                    ...(Array.isArray(AND) ? AND : []),
                    { wbyAco_location: { folderId_not_in: deniedFolderIds } }
                ]
            }
        });
    }

    private async listDeniedFolderIds(model: CmsModel): Promise<string[]> {
        const flps = await this.folderLevelPermissions.listFolderLevelPermissions({
            where: { type: getFolderType(model) }
        });

        const denied: string[] = [];
        for (const flp of flps) {
            const canRead = await this.folderLevelPermissions.canAccessFolderContent({
                permissions: flp.permissions,
                rwd: "r"
            });
            if (!canRead) {
                denied.push(flp.id);
            }
        }
        return denied;
    }
}

export const GetUniqueFieldValuesWithFlpDecorator = createDecorator({
    abstraction: GetUniqueFieldValuesUseCase,
    decorator: GetUniqueFieldValuesWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
