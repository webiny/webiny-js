import { useCallback, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";
import { ListPagesGqlGateway } from "./ListPagesGqlGateway.js";
import { ListFolders } from "./ListFolders";
import { FolderDtoMapper } from "./PageDto.js";
import { useFoldersType, useGetFolderGraphQLSelection } from "~/hooks";
import { FolderItem } from "~/types";

export const useListFolders = () => {
    const client = useApolloClient();
    const type = useFoldersType();
    const fields = useGetFolderGraphQLSelection();
    const gateway = new ListPagesGqlGateway(client, fields);

    const [vm, setVm] = useState<{
        folders: FolderItem[];
        loading: Record<string, boolean>;
    }>({
        folders: [],
        loading: {
            INIT: true
        }
    });

    const {
        useCase,
        folders: foldersCache,
        loading
    } = useMemo(() => {
        return ListFolders.getInstance(type, gateway);
    }, [type, gateway]);

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
