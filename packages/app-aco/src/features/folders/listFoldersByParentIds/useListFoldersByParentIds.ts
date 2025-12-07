import { useCallback, useEffect, useState } from "react";
import { autorun } from "mobx";
import { useFeature, useContainer } from "@webiny/app";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { ListFoldersByParentIdsFeature } from "./feature.js";
import { FolderDtoMapper } from "./FolderDto.js";
import type { FolderItem } from "~/types.js";
import { ROOT_FOLDER } from "~/constants.js";

export const useListFoldersByParentIds = () => {
    const container = useContainer();
    const { useCase, loading: loadingState } = useFeature(ListFoldersByParentIdsFeature);

    const foldersCache = container.resolve(FoldersCache);

    const [vm, setVm] = useState<{
        folders: FolderItem[];
        loading: string[];
    }>({
        folders: [],
        loading: []
    });

    const listFoldersByParentIds = useCallback(
        (parentIds?: string[]) => {
            return useCase.execute(parentIds);
        },
        [useCase]
    );

    const getIsFolderLoading = useCallback(
        (action = ROOT_FOLDER) => {
            if (!loadingState) {
                return true;
            }

            return loadingState.isLoading(action);
        },
        [loadingState]
    );

    useEffect(() => {
        return autorun(() => {
            const folders = foldersCache.getItems().map(folder => FolderDtoMapper.toDTO(folder));

            setVm(vm => ({
                ...vm,
                folders
            }));
        });
    }, [foldersCache]);

    useEffect(() => {
        return autorun(() => {
            const loading = loadingState.getActiveLoadings();

            setVm(vm => ({
                ...vm,
                loading
            }));
        });
    }, [loadingState]);

    return {
        ...vm,
        listFoldersByParentIds,
        getIsFolderLoading
    };
};
