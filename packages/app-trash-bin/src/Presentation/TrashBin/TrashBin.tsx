import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
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
    TrashBinItemsRepositoryWithLoading,
    ITrashBinItemMapper,
    TrashBinItemDTO
} from "~/Domain";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinListGateway,
    ITrashBinRestoreItemGateway
} from "~/Gateways";
import { TrashBinControllers } from "~/Presentation/TrashBin/TrashBinControllers";

export interface TrashBinProps {
    listGateway: ITrashBinListGateway<any>;
    deleteGateway: ITrashBinDeleteItemGateway;
    restoreGateway: ITrashBinRestoreItemGateway<any>;
    itemMapper: ITrashBinItemMapper<any>;
    onClose: () => void;
    onItemAfterRestore: (item: TrashBinItemDTO) => Promise<void>;
    sorting: Sorting[];
    title: string;
    retentionPeriod: number;
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
            props.restoreGateway,
            props.itemMapper
        );

        return new TrashBinItemsRepositoryWithLoading(loadingRepository, trashBinItemsRepository);
    }, [
        metaRepository,
        loadingRepository,
        props.listGateway,
        props.deleteGateway,
        props.restoreGateway,
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
            props.retentionPeriod,
            props.nameColumnId
        );
    }, [
        itemsRepository,
        selectedRepository,
        sortingRepository,
        searchRepository,
        props.retentionPeriod,
        props.nameColumnId
    ]);

    useEffect(() => {
        controllers.listItems.execute();
    }, []);

    return (
        <TrashBinProvider
            controllers={controllers}
            presenter={presenter}
            onItemAfterRestore={props.onItemAfterRestore}
        >
            <TrashBinOverlay onExited={props.onClose} title={props.title} />
        </TrashBinProvider>
    );
});
