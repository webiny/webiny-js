import { useCallback, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";
import { ListFoldersByParentIdsGqlGateway } from "./ListFoldersByParentIdsGqlGateway";
import { ListFoldersByParentIds } from "./ListFoldersByParentIds";
import { FolderDtoMapper } from "./FolderDto";
import { useFoldersType, useGetFolderGraphQLSelection } from "~/hooks";
import { FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";

export const useListFoldersByParentIds = () => {
    const client = useApolloClient();
    const type = useFoldersType();
    const fields = useGetFolderGraphQLSelection();
    const gateway = new ListFoldersByParentIdsGqlGateway(client, fields);

    const [vm, setVm] = useState<{
        folders: FolderItem[];
        loading: string[];
    }>({
        folders: [],
        loading: []
    });

    const {
        useCase,
        folders: foldersCache,
        loading: loadingState
    } = useMemo(() => {
        return ListFoldersByParentIds.getInstance(type, gateway);
    }, [type, gateway]);

    const listFoldersByParentIds = useCallback(
        (parentIds?: string[]) => {
            return useCase.execute({ parentIds });
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
