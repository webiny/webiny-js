import { useCallback, useMemo } from "react";
import { useWcp } from "@webiny/app-wcp";
import { FoldersCache } from "../cache";
import { GetCanManagePermissionsRepository } from "./GetCanManagePermissionsRepository";
import { GetCanManagePermissionsWithFlpUseCase } from "./GetCanManagePermissionsWithFlpUseCase";
import { GetCanManagePermissionsUseCase } from "./GetCanManagePermissionsUseCase";

export const useGetCanManagePermissions = (cache: FoldersCache) => {
    const { canUseFolderLevelPermissions } = useWcp();

    const repository = useMemo(() => {
        return new GetCanManagePermissionsRepository(cache);
    }, [cache]);

    const useCase = useMemo(() => {
        if (canUseFolderLevelPermissions) {
            return new GetCanManagePermissionsWithFlpUseCase(
                repository,
                canUseFolderLevelPermissions
            );
        }

        return new GetCanManagePermissionsUseCase(repository);
    }, [repository, canUseFolderLevelPermissions]);

    const canManagePermissions = useCallback(
        (id: string) => {
            return useCase.execute(id);
        },
        [useCase]
    );

    return {
        canManagePermissions
    };
};
