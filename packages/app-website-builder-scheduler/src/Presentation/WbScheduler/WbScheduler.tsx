import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import type { Sorting } from "@webiny/app-utils";
import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { WbSchedulerProvider } from "../hooks/index.js";
import { WbSchedulerOverlay } from "../components/WbSchedulerOverlay/index.js";
import { WbSchedulerPresenter } from "./WbSchedulerPresenter.js";
import {
    wbSchedulerItemsRepositoryFactory,
    WbSchedulerItemsRepositoryWithLoading,
    searchRepositoryFactory,
    selectedItemsRepositoryFactory,
    SortingRepositoryWithDefaults
} from "~/Domain/index.js";
import type {
    IWbSchedulerCancelGateway,
    IWbSchedulerGetGateway,
    IWbSchedulerListGateway,
    IWbSchedulerPublishGateway,
    IWbSchedulerUnpublishGateway
} from "~/Gateways/index.js";
import { WbSchedulerControllers } from "~/Presentation/WbScheduler/WbSchedulerControllers.js";

export interface WbSchedulerInternalProps {
    targetId: string;
    getGateway: IWbSchedulerGetGateway;
    listGateway: IWbSchedulerListGateway;
    cancelGateway: IWbSchedulerCancelGateway;
    publishGateway: IWbSchedulerPublishGateway;
    unpublishGateway: IWbSchedulerUnpublishGateway;
    onClose: () => void;
    sorting: Sorting[];
    title?: string;
}

export const WbScheduler = observer((props: WbSchedulerInternalProps) => {
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
        const wbSchedulerItemsRepository = wbSchedulerItemsRepositoryFactory.getRepository({
            metaRepository,
            getGateway: props.getGateway,
            cancelGateway: props.cancelGateway,
            publishGateway: props.publishGateway,
            unpublishGateway: props.unpublishGateway,
            listGateway: props.listGateway,
            targetId: props.targetId
        });

        return new WbSchedulerItemsRepositoryWithLoading(
            loadingRepository,
            wbSchedulerItemsRepository
        );
    }, [
        metaRepository,
        loadingRepository,
        props.listGateway,
        props.cancelGateway,
        props.publishGateway,
        props.unpublishGateway,
        props.targetId
    ]);

    const controllers = useMemo(() => {
        return new WbSchedulerControllers({
            itemsRepository,
            selectedRepository,
            sortingRepository,
            searchRepository
        }).getControllers();
    }, [
        itemsRepository,
        selectedRepository,
        sortingRepository,
        searchRepository,
        loadingRepository
    ]);

    const presenter = useMemo(() => {
        return new WbSchedulerPresenter({
            itemsRepository,
            selectedRepository,
            sortingRepository,
            searchRepository
        });
    }, [itemsRepository, selectedRepository, sortingRepository, searchRepository]);

    useEffect(() => {
        controllers.listItems.execute();
    }, [controllers]);

    return (
        <WbSchedulerProvider controllers={controllers} presenter={presenter}>
            <WbSchedulerOverlay onExited={props.onClose} title={props.title ?? "Scheduler"} />
        </WbSchedulerProvider>
    );
});
