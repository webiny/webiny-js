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
import { ListEntriesWithMeta } from "~/components/TrashBin/gateways";
import { TrashBinPresenter } from "~/components/TrashBin/TrashBinPresenter";
import { LoadingEnum } from "~/types";
import {
    selectedItemsRepositoryFactory,
    trashBinItemsRepositoryFactory,
    TrashBinItemsRepositoryWithLoading,
    TrashBinItemsRepositoryWithSort
} from "~/components/TrashBin/domain";

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

    const listGateway = useMemo(() => {
        return new ListEntriesWithMeta(metaRepository, props.listGateway);
    }, [metaRepository]);

    const itemsRepository = useMemo(() => {
        return trashBinItemsRepositoryFactory.getRepository(
            listGateway,
            props.deleteGateway,
            props.itemMapper
        );
    }, [listGateway]);

    const sortRepository = useMemo(() => {
        return sortRepositoryFactory.getRepository();
    }, []);

    const loadingRepository = useMemo(() => {
        return loadingRepositoryFactory.getRepository();
    }, []);

    const selectedRepository = useMemo(() => {
        return selectedItemsRepositoryFactory.getRepository();
    }, []);

    const repository = useMemo(() => {
        sortRepository.init([{ field: "deletedOn", order: "desc" }]);
        loadingRepository.init(LoadingEnum);

        const withSortRepo = new TrashBinItemsRepositoryWithSort(sortRepository, itemsRepository);
        return new TrashBinItemsRepositoryWithLoading(loadingRepository, withSortRepo);
    }, [itemsRepository, sortRepository, loadingRepository]);

    const controllers = useMemo(() => {
        return useControllers(repository, selectedRepository, sortRepository, metaRepository);
    }, [repository, sortRepository, metaRepository]);

    const presenter = new TrashBinPresenter(
        repository,
        selectedRepository,
        loadingRepository,
        metaRepository,
        sortRepository
    );

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
