import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { AcoWithConfig } from "@webiny/app-aco";
import { CompositionScope } from "@webiny/app-admin";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway,
    loadingRepositoryFactory,
    sortRepositoryFactory,
    trashBinRepositoryFactory,
    metaRepositoryFactory,
    TrashBinRepositoryWithLoading,
    TrashBinRepositoryWithSort
} from "@webiny/app-trash-bin-common";
import { useControllers } from "./controllers";
import { TrashBinListWithConfig } from "~/configs";
import { TrashBinProvider } from "~/hooks";
import { TrashBinOverlay } from "~/components/TrashBinOverlay";
import { ListEntriesWithMeta } from "~/components/TrashBin/gateways";
import { TrashBinPresenter } from "~/components/TrashBin/TrashBinPresenter";
import { LoadingEnum } from "~/types";

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

    const entryRepository = useMemo(() => {
        return trashBinRepositoryFactory.getRepository(
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

    const repository = useMemo(() => {
        sortRepository.init([{ field: "deletedOn", order: "desc" }]);
        loadingRepository.init(LoadingEnum);

        const withSortRepo = new TrashBinRepositoryWithSort(sortRepository, entryRepository);
        return new TrashBinRepositoryWithLoading(loadingRepository, withSortRepo);
    }, [entryRepository, sortRepository, loadingRepository]);

    const controllers = useMemo(() => {
        return useControllers(repository, sortRepository, metaRepository);
    }, [repository, sortRepository, metaRepository]);

    const presenter = new TrashBinPresenter(
        repository,
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
