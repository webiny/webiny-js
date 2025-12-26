import { useCallback, useEffect, useState } from "react";
import { autorun } from "mobx";
import { useFeature, useContainer } from "@webiny/app";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { FolderDtoMapper } from "~/domain/folder/FolderDtoMapper.js";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { ListFoldersFeature } from "./feature.js";

export const useListFolders = () => {
    const container = useContainer();
    const { useCase, loading } = useFeature(ListFoldersFeature);

    const foldersCache = container.resolve(FoldersCache);

    const [vm, setVm] = useState<{
        folders: FolderDto[];
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
