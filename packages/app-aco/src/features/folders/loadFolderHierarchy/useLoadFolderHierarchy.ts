import { useContainer } from "@webiny/app";
import { useCallback, useEffect, useState } from "react";
import { autorun } from "mobx";
import { useFeature } from "@webiny/app";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { LoadingActionsEnum } from "~/types.js";
import { LoadFolderHierarchyFeature } from "./feature.js";
import { FolderDtoMapper } from "./FolderDto.js";
import type { FolderItem } from "~/types.js";

export const useLoadFolderHierarchy = () => {
    const container = useContainer();
    const { useCase, loading } = useFeature(LoadFolderHierarchyFeature);

    const foldersCache = container.resolve(FoldersCache);

    const [vm, setVm] = useState<{
        folders: FolderItem[];
        loading: Record<string, boolean>;
    }>({
        folders: [],
        loading: {
            INIT: true
        }
    });

    const loadFolderHierarchy = useCallback(
        (id: string) => {
            return useCase.execute(id);
        },
        [useCase]
    );

    const getIsFolderLoading = useCallback((action = LoadingActionsEnum.init) => {
        return loading.isLoading(action);
    }, []);

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
            const loadingState = loading.get();

            setVm(vm => ({
                ...vm,
                loading: loadingState
            }));
        });
    }, [loading]);

    return {
        ...vm,
        getIsFolderLoading,
        loadFolderHierarchy
    };
};
