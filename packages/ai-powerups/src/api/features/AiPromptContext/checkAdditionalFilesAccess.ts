import { Result } from "@webiny/feature/api";
import type { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";

/**
 * The generation tasks read `additionalFileIds` with authorization disabled, so every file must
 * be resolved through File Manager (with the caller's permissions) before a task is queued.
 */
export const checkAdditionalFilesAccess = async (
    getFile: GetFileUseCase.Interface,
    fileIds: string[] | null | undefined
): Promise<Result<void, GetFileUseCase.Error>> => {
    if (!fileIds || fileIds.length === 0) {
        return Result.ok();
    }

    for (const fileId of new Set(fileIds)) {
        const result = await getFile.execute(fileId);
        if (result.isFail()) {
            return Result.fail(result.error);
        }
    }

    return Result.ok();
};
