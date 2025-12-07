import { useContainer } from "@webiny/app";
import { useCallback, useEffect, useState } from "react";
import { autorun } from "mobx";
import { useFeature } from "@webiny/app";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { LoadFolderHierarchyFeature } from "./feature.js";
import { FolderDtoMapper } from "./FolderDto.js";
import type { FolderItem } from "~/types.js";

export const useLoadFolderHierarchy = () => {
    const { useCase } = useFeature(LoadFolderHierarchyFeature);
    const container = useContainer();
    const foldersCache = container.resolve(FoldersCache);

    const [vm, setVm] = useState<{
        folders: FolderItem[];
    }>({
        folders: []
    });

    const loadFolderHierarchy = useCallback(
        (id: string) => {
            return useCase.execute(id);
        },
        [useCase]
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

    return {
        ...vm,
        loadFolderHierarchy
    };
};
