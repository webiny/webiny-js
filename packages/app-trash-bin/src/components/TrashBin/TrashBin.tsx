import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway
} from "@webiny/app-trash-bin-common";
import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    Sorting,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { TrashBinProvider } from "~/hooks";
import { TrashBinOverlay } from "~/components/TrashBinOverlay";
import { TrashBinPresenter } from "~/components/TrashBin/TrashBinPresenter";
import {
    selectedItemsRepositoryFactory,
    SortRepositoryWithDefaults,
    trashBinItemsRepositoryFactory,
    TrashBinItemsRepositoryWithLoading
} from "~/components/TrashBin/domain";
import { searchRepositoryFactory } from "~/components/TrashBin/domain/SearchRepositoryFactory";
import { getUseCases } from "~/components/TrashBin/useCases";
import { getControllers } from "~/components/TrashBin/controllers";

export interface TrashBinProps {
    listGateway: ITrashBinListGateway<any>;
    deleteGateway: ITrashBinDeleteItemGateway;
    itemMapper: ITrashBinItemMapper<any>;
    onClose: () => void;
    sorting: Sorting[];
}

export const TrashBin = observer((props: TrashBinProps) => {
    const metaRepository = useMemo(() => {
        return metaRepositoryFactory.getRepository();
    }, []);

    const searchRepository = useMemo(() => {
        return searchRepositoryFactory.getRepository();
    }, []);

    const sortingRepository = useMemo(() => {
        const sortRepository = sortRepositoryFactory.getRepository();
        return new SortRepositoryWithDefaults(props.sorting, sortRepository);
    }, [props.sorting]);

    const loadingRepository = useMemo(() => {
        return loadingRepositoryFactory.getRepository();
    }, []);

    const selectedRepository = useMemo(() => {
        return selectedItemsRepositoryFactory.getRepository();
    }, []);

    const itemsRepository = useMemo(() => {
        const trashBinItemsRepository = trashBinItemsRepositoryFactory.getRepository(
            metaRepository,
            props.listGateway,
            props.deleteGateway,
            props.itemMapper
        );

        return new TrashBinItemsRepositoryWithLoading(loadingRepository, trashBinItemsRepository);
    }, [
        metaRepository,
        loadingRepository,
        props.listGateway,
        props.deleteGateway,
        props.itemMapper
    ]);

    const useCases = useMemo(() => {
        return getUseCases(
            itemsRepository,
            selectedRepository,
            sortingRepository,
            searchRepository
        );
    }, [
        itemsRepository,
        selectedRepository,
        sortingRepository,
        searchRepository,
        loadingRepository
    ]);

    const controllers = getControllers(useCases);

    const presenter = useMemo(() => {
        return new TrashBinPresenter(
            itemsRepository,
            selectedRepository,
            sortingRepository,
            searchRepository
        );
    }, [itemsRepository, selectedRepository, sortingRepository, searchRepository]);

    useEffect(() => {
        controllers.listItems.execute();
    }, []);

    return (
        <TrashBinProvider controllers={controllers} presenter={presenter}>
            <TrashBinOverlay vm={presenter.vm} controllers={controllers} onExited={props.onClose} />
        </TrashBinProvider>
    );
});
