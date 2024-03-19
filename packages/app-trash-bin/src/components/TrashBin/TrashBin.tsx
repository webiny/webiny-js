import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { AcoWithConfig } from "@webiny/app-aco";
import { CompositionScope } from "@webiny/app-admin";
import {
    ISortController,
    ITrashBinPresenter,
    ITrashBinRepository,
    loadingRepositoryFactory,
    sortRepositoryFactory,
    TrashBinRepositoryWithLoading,
    TrashBinRepositoryWithSort
} from "@webiny/app-trash-bin-common";
import {
    LoadingPresenter,
    SortPresenter,
    TrashBinPresenter,
    TrashBinPresenterWithLoading,
    TrashBinPresenterWithSorting
} from "./presenters";
import { SortController, SortTrashBinController, TrashBinController } from "./controllers";
import { TrashBinListWithConfig } from "~/configs";
import { TrashBinProvider } from "~/hooks";
import { TrashBinOverlay } from "~/components/TrashBinOverlay";

export interface TrashBinProps {
    repository: ITrashBinRepository;
    onClose: () => void;
}

export const TrashBin = observer((props: TrashBinProps) => {
    const sortRepository = useMemo(() => {
        return sortRepositoryFactory.getRepository([{ field: "deletedOn", order: "desc" }]);
    }, []);

    const sortPresenter = useMemo(() => new SortPresenter(sortRepository), [sortRepository]);
    const sortController = useMemo(() => new SortController(sortRepository), [sortRepository]);

    const loadingRepository = useMemo(() => {
        return loadingRepositoryFactory.getRepository();
    }, []);

    const loadingPresenter = useMemo(
        () => new LoadingPresenter(loadingRepository),
        [loadingRepository]
    );

    const repository = useMemo(() => {
        const withSortRepo = new TrashBinRepositoryWithSort(sortRepository, props.repository);
        return new TrashBinRepositoryWithLoading(loadingRepository, withSortRepo);
    }, [props.repository, sortRepository, loadingRepository]);

    const trashBinPresenter = useMemo(() => {
        return new TrashBinPresenter(repository);
    }, [repository]);

    const presenter = useMemo<ITrashBinPresenter>(() => {
        const withSortPresenter = new TrashBinPresenterWithSorting(
            trashBinPresenter,
            sortPresenter
        );
        return new TrashBinPresenterWithLoading(withSortPresenter, loadingPresenter);
    }, [trashBinPresenter, sortPresenter, loadingPresenter]);

    const controller = useMemo<TrashBinController>(() => {
        return new TrashBinController(repository);
    }, [repository]);

    const sortTrashBinController = useMemo<ISortController>(() => {
        return new SortTrashBinController(sortController, controller);
    }, [repository]);

    useEffect(() => {
        presenter.init();
    }, []);

    return (
        <CompositionScope name={"trash"}>
            <AcoWithConfig>
                <TrashBinListWithConfig>
                    <TrashBinProvider controller={controller} presenter={presenter}>
                        <TrashBinOverlay
                            vm={presenter.vm}
                            controller={controller}
                            sortController={sortTrashBinController}
                            onExited={props.onClose}
                        />
                    </TrashBinProvider>
                </TrashBinListWithConfig>
            </AcoWithConfig>
        </CompositionScope>
    );
});
