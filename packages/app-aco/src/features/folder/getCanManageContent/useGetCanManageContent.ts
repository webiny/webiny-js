import { useCallback, useMemo } from "react";
import { useWcp } from "@webiny/app-wcp";
import { FoldersCache } from "../cache";
import { GetCanManageContentRepository } from "./GetCanManageContentRepository";
import { GetCanManageContentWithFlpUseCase } from "./GetCanManageContentWithFlpUseCase";
import { GetCanManageContentUseCase } from "./GetCanManageContentUseCase";

export const useGetCanManageContent = (cache: FoldersCache) => {
    const { canUseFolderLevelPermissions } = useWcp();

    const repository = useMemo(() => {
        return new GetCanManageContentRepository(cache);
    }, [cache]);

    const useCase = useMemo(() => {
        if (canUseFolderLevelPermissions) {
            return new GetCanManageContentWithFlpUseCase(repository, canUseFolderLevelPermissions);
        }

        return new GetCanManageContentUseCase(repository);
    }, [repository, canUseFolderLevelPermissions]);

    const canManageContent = useCallback(
        (id: string) => {
            return useCase.execute(id);
        },
        [useCase]
    );

    return {
        canManageContent
    };
};
