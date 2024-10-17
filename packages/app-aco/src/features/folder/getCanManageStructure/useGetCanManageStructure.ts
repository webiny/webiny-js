import { useCallback, useMemo } from "react";
import { useWcp } from "@webiny/app-wcp";
import { FoldersCache } from "../cache";
import { GetCanManageStructureRepository } from "./GetCanManageStructureRepository";
import { GetCanManageStructureWithFlpUseCase } from "./GetCanManageStructureWithFlpUseCase";
import { GetCanManageStructureUseCase } from "./GetCanManageStructureUseCase";

export const useGetCanManageStructure = (cache: FoldersCache) => {
    const { canUseFolderLevelPermissions } = useWcp();

    const repository = useMemo(() => {
        return new GetCanManageStructureRepository(cache);
    }, [cache]);

    const useCase = useMemo(() => {
        if (canUseFolderLevelPermissions) {
            return new GetCanManageStructureWithFlpUseCase(
                repository,
                canUseFolderLevelPermissions
            );
        }

        return new GetCanManageStructureUseCase(repository);
    }, [repository, canUseFolderLevelPermissions]);

    const canManageStructure = useCallback(
        (id: string) => {
            return useCase.execute(id);
        },
        [useCase]
    );

    return {
        canManageStructure
    };
};
