import { useCallback, useEffect, useState } from "react";
import { autorun } from "mobx";
import { useFeature, useContainer } from "@webiny/app";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { ListFoldersFeature } from "./feature.js";
import { FolderDtoMapper } from "./FolderDto.js";
import type { FolderItem } from "~/types.js";

export const useListFolders = () => {
    const container = useContainer();
    const { useCase, loading } = useFeature(ListFoldersFeature);

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

    const listFolders = useCallback(() => {
        return useCase.execute();
    }, [useCase]);

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
        listFolders
    };
};
