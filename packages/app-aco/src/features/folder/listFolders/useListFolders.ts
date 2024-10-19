import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";
import { ListFoldersGqlGateway } from "./ListFoldersGqlGateway";
import { ListFolders } from "./ListFolders";
import { FolderDtoMapper } from "./FolderDto";
import { FoldersContext } from "~/contexts/folders";
import { FolderItem } from "~/types";

export const useListFolders = () => {
    const client = useApolloClient();
    const gateway = new ListFoldersGqlGateway(client);

    const [vm, setVm] = useState<{
        folders: FolderItem[];
        loading: Record<string, boolean>;
    }>({
        folders: [],
        loading: {
            INIT: true
        }
    });

    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useCreateFolder must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const {
        useCase,
        folders: foldersCache,
        loading
    } = useMemo(() => {
        return ListFolders.instance(gateway, type);
    }, [type, gateway]);

    const listFolders = useCallback(() => {
        return useCase.execute();
    }, [useCase]);

    useEffect(() => {
        if (foldersCache.hasItems()) {
            return; // Skip if we already have folders in the cache.
        }

        listFolders();
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
        listFolders
    };
};
