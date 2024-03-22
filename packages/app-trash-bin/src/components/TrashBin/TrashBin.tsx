import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { AcoWithConfig } from "@webiny/app-aco";
import { CompositionScope } from "@webiny/app-admin";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway
} from "@webiny/app-trash-bin-common";
import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { TrashBinListWithConfig } from "~/configs";
import { TrashBinProvider } from "~/hooks";
import { TrashBinOverlay } from "~/components/TrashBinOverlay";
import { TrashBinPresenter } from "~/components/TrashBin/TrashBinPresenter";
import {
    selectedItemsRepositoryFactory,
    trashBinItemsRepositoryFactory,
    TrashBinItemsRepositoryWithLoading,
    TrashBinItemsRepositoryWithSearch,
    TrashBinItemsRepositoryWithSorting
} from "~/components/TrashBin/domain";
import { searchRepositoryFactory } from "~/components/TrashBin/domain/SearchRepositoryFactory";
import { getUseCases } from "~/components/TrashBin/useCases";

export interface TrashBinProps {
    listGateway: ITrashBinListGateway<any>;
    deleteGateway: ITrashBinDeleteItemGateway;
    itemMapper: ITrashBinItemMapper<any>;
    onClose: () => void;
}

export const TrashBin = observer((props: TrashBinProps) => {
    const metaRepository = useMemo(() => {
        return metaRepositoryFactory.getRepository();
    }, []);

    const searchRepository = useMemo(() => {
        return searchRepositoryFactory.getRepository();
    }, []);

    const sortingRepository = useMemo(() => {
        return sortRepositoryFactory.getRepository([{ field: "deletedOn", order: "desc" }]);
    }, []);

    const loadingRepository = useMemo(() => {
        return loadingRepositoryFactory.getRepository();
    }, []);

    const selectedRepository = useMemo(() => {
        return selectedItemsRepositoryFactory.getRepository();
    }, []);

    const itemsRepository = useMemo(() => {
        return trashBinItemsRepositoryFactory.getRepository(
            metaRepository,
            props.listGateway,
            props.deleteGateway,
            props.itemMapper
        );
    }, [props.listGateway, props.deleteGateway, props.itemMapper]);

    const repository = useMemo(() => {
        const repoWithSorting = new TrashBinItemsRepositoryWithSorting(
            sortingRepository,
            itemsRepository
        );
        const repoWithLoading = new TrashBinItemsRepositoryWithLoading(
            loadingRepository,
            repoWithSorting
        );
        return new TrashBinItemsRepositoryWithSearch(searchRepository, repoWithLoading);
    }, [itemsRepository, metaRepository, loadingRepository, searchRepository, sortingRepository]);

    const useCases = useMemo(() => {
        return getUseCases(
            repository,
            selectedRepository,
            sortingRepository,
            metaRepository,
            searchRepository
        );
    }, [repository, sortingRepository, metaRepository, searchRepository]);

    const presenter = useMemo(() => {
        return new TrashBinPresenter(
            repository,
            selectedRepository,
            loadingRepository,
            metaRepository,
            sortingRepository,
            searchRepository
        );
    }, [
        repository,
        selectedRepository,
        loadingRepository,
        metaRepository,
        sortingRepository,
        searchRepository
    ]);

    useEffect(() => {
        presenter.init();
    }, []);

    return (
        <CompositionScope name={"trash"}>
            <AcoWithConfig>
                <TrashBinListWithConfig>
                    <TrashBinProvider useCases={useCases} presenter={presenter}>
                        <TrashBinOverlay
                            vm={presenter.vm}
                            useCases={useCases}
                            onExited={props.onClose}
                        />
                    </TrashBinProvider>
                </TrashBinListWithConfig>
            </AcoWithConfig>
        </CompositionScope>
    );
});
