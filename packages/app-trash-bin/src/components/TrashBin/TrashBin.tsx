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
} from "@webiny/app-utilities";
import { useControllers } from "./controllers";
import { TrashBinListWithConfig } from "~/configs";
import { TrashBinProvider } from "~/hooks";
import { TrashBinOverlay } from "~/components/TrashBinOverlay";
import {
    DeleteItemWithLoading,
    ListItemsWithLoading,
    ListItemsWithMeta,
    ListItemsWithSearch,
    ListItemsWithSorting
} from "~/components/TrashBin/gateways";
import { TrashBinPresenter } from "~/components/TrashBin/TrashBinPresenter";
import {
    selectedItemsRepositoryFactory,
    trashBinItemsRepositoryFactory
} from "~/components/TrashBin/domain";
import { searchRepositoryFactory } from "~/components/TrashBin/domain/SearchRepositoryFactory";

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

    const sortRepository = useMemo(() => {
        return sortRepositoryFactory.getRepository();
    }, []);

    const loadingRepository = useMemo(() => {
        return loadingRepositoryFactory.getRepository();
    }, []);

    const listGateway = useMemo(() => {
        const withSearch = new ListItemsWithSearch(searchRepository, props.listGateway);
        const withSort = new ListItemsWithSorting(sortRepository, withSearch);
        const withMeta = new ListItemsWithMeta(metaRepository, withSort);
        const withLoading = new ListItemsWithLoading(loadingRepository, withMeta);
        return new ListItemsWithMeta(metaRepository, withLoading);
    }, [
        metaRepository,
        searchRepository,
        sortRepository,
        metaRepository,
        loadingRepository,
        props.listGateway
    ]);

    const deleteItemGateway = useMemo(() => {
        return new DeleteItemWithLoading(loadingRepository, props.deleteGateway);
    }, [loadingRepository, props.deleteGateway]);

    const itemsRepository = useMemo(() => {
        return trashBinItemsRepositoryFactory.getRepository(
            listGateway,
            deleteItemGateway,
            props.itemMapper
        );
    }, [listGateway, deleteItemGateway, props.itemMapper]);

    const selectedRepository = useMemo(() => {
        return selectedItemsRepositoryFactory.getRepository();
    }, []);

    const controllers = useMemo(() => {
        return useControllers(
            itemsRepository,
            selectedRepository,
            sortRepository,
            metaRepository,
            searchRepository
        );
    }, [itemsRepository, sortRepository, metaRepository, searchRepository]);

    const presenter = useMemo(() => {
        return new TrashBinPresenter(
            itemsRepository,
            selectedRepository,
            loadingRepository,
            metaRepository,
            sortRepository,
            searchRepository
        );
    }, [
        itemsRepository,
        selectedRepository,
        loadingRepository,
        metaRepository,
        sortRepository,
        searchRepository
    ]);

    useEffect(() => {
        presenter.init();
    }, []);

    return (
        <CompositionScope name={"trash"}>
            <AcoWithConfig>
                <TrashBinListWithConfig>
                    <TrashBinProvider controllers={controllers} presenter={presenter}>
                        <TrashBinOverlay
                            vm={presenter.vm}
                            controllers={controllers}
                            onExited={props.onClose}
                        />
                    </TrashBinProvider>
                </TrashBinListWithConfig>
            </AcoWithConfig>
        </CompositionScope>
    );
});
