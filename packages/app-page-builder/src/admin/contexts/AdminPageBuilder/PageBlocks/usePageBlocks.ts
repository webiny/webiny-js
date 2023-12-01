import { useEffect, useState, useMemo, useCallback } from "react";
import { autorun } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";
import { PbPageBlock } from "~/types";
import { blocksRepositoryFactory } from "./BlocksRepositoryFactory";

export function usePageBlocks() {
    const client = useApolloClient();
    const blocksRepository = useMemo(() => blocksRepositoryFactory.getRepository(client), [client]);

    const [vm, setVm] = useState<{
        pageBlocks: PbPageBlock[];
        loading: boolean;
        loadingLabel: string;
    }>({
        pageBlocks: [],
        loading: false,
        loadingLabel: ""
    });

    useEffect(() => {
        blocksRepository.listPageBlocks();
    }, [blocksRepository]);

    useEffect(() => {
        return autorun(() => {
            const loading = blocksRepository.getLoading();

            setVm(vm => ({
                ...vm,
                loading: loading.isLoading,
                loadingLabel: loading.loadingLabel
            }));
        });
    }, [blocksRepository]);

    useEffect(() => {
        return autorun(() => {
            const pageBlocks = blocksRepository.getPageBlocks();

            setVm(vm => ({ ...vm, pageBlocks }));
        });
    }, [blocksRepository]);

    const createBlock = useCallback(
        (pageBlock: { name: string; category: string; content?: unknown }) => {
            return blocksRepository.createPageBlock(pageBlock);
        },
        [blocksRepository]
    );

    const updateBlock = useCallback(
        (pageBlock: { id: string; name?: string; content?: unknown; category?: string }) => {
            return blocksRepository.updatePageBlock(pageBlock);
        },
        [blocksRepository]
    );

    const deleteBlock = useCallback(
        (id: string) => {
            return blocksRepository.deletePageBlock(id);
        },
        [blocksRepository]
    );

    const listBlocks = useCallback(
        async (category?: string) => {
            const pageBlocks = await blocksRepository.listPageBlocks();
            if (category) {
                return pageBlocks.filter(pb => pb.blockCategory === category);
            }
            return pageBlocks;
        },
        [blocksRepository]
    );

    const getBlockById = useCallback(
        (id: string) => blocksRepository.getById(id),
        [blocksRepository]
    );

    const refetchBlock = useCallback(
        (id: string) => blocksRepository.refetchById(id),
        [blocksRepository]
    );

    return { ...vm, listBlocks, getBlockById, createBlock, updateBlock, deleteBlock, refetchBlock };
}
