import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { AcoWithConfig } from "@webiny/app-aco";
import { CompositionScope } from "@webiny/app-admin";
import {
    ISortController,
    ITrashBinController,
    ITrashBinPresenter,
    ITrashBinRepository,
    sortRepositoryFactory,
    TrashBinRepositoryWithSort
} from "@webiny/app-trash-bin-common";
import { TrashBinPresenter } from "./TrashBinPresenter";
import { TrashBinController } from "./TrashBinController";
import { TrashBinListWithConfig } from "~/configs";
import { TrashBinOverlay } from "~/components/TrashBinOverlay";
import { TrashBinProvider } from "~/hooks";
import { SortPresenter } from "~/components/TrashBin/SortPresenter";
import { SortController } from "~/components/TrashBin/SortController";
import { TrashBinPresenterWithSorting } from "~/components/TrashBin/TrashBinPresenterWithSorting";
import { SortTrashBinController } from "~/components/TrashBin/SortTrashBinController";

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

    const repository = useMemo(() => {
        return new TrashBinRepositoryWithSort(sortRepository, props.repository);
    }, [props.repository, sortRepository]);

    const trashBinPresenter = useMemo<ITrashBinPresenter>(() => {
        return new TrashBinPresenter(repository);
    }, [repository]);

    const presenter = useMemo<ITrashBinPresenter>(() => {
        return new TrashBinPresenterWithSorting(trashBinPresenter, sortPresenter);
    }, [trashBinPresenter, sortPresenter]);

    const controller = useMemo<ITrashBinController>(() => {
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
