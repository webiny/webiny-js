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
import { TrashBinProvider } from "../hooks";
import { TrashBinOverlay } from "../components/TrashBinOverlay";
import { TrashBinPresenter } from "./TrashBinPresenter";
import {
    selectedItemsRepositoryFactory,
    searchRepositoryFactory,
    SortingRepositoryWithDefaults,
    trashBinItemsRepositoryFactory,
    TrashBinItemsRepositoryWithLoading
} from "~/Domain";
import { TrashBinControllers } from "~/Presentation/TrashBin/TrashBinControllers";

export interface TrashBinProps {
    listGateway: ITrashBinListGateway<any>;
    deleteGateway: ITrashBinDeleteItemGateway;
    itemMapper: ITrashBinItemMapper<any>;
    onClose: () => void;
    sorting: Sorting[];
    title: string;
    nameColumnId?: string;
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
        return new SortingRepositoryWithDefaults(props.sorting, sortRepository);
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

    const controllers = useMemo(() => {
        return new TrashBinControllers(
            itemsRepository,
            selectedRepository,
            sortingRepository,
            searchRepository
        ).getControllers();
    }, [
        itemsRepository,
        selectedRepository,
        sortingRepository,
        searchRepository,
        loadingRepository
    ]);

    const presenter = useMemo(() => {
        return new TrashBinPresenter(
            itemsRepository,
            selectedRepository,
            sortingRepository,
            searchRepository,
            props.nameColumnId
        );
    }, [
        itemsRepository,
        selectedRepository,
        sortingRepository,
        searchRepository,
        props.nameColumnId
    ]);

    useEffect(() => {
        controllers.listItems.execute();
    }, []);

    return (
        <TrashBinProvider controllers={controllers} presenter={presenter}>
            <TrashBinOverlay
                vm={presenter.vm}
                controllers={controllers}
                onExited={props.onClose}
                title={props.title}
            />
        </TrashBinProvider>
    );
});
