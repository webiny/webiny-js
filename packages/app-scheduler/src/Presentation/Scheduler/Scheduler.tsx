import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import type { Sorting } from "@webiny/app-utils";
import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { SchedulerProvider } from "../hooks/index.js";
import { SchedulerOverlay } from "../components/SchedulerOverlay/index.js";
import { SchedulerPresenter } from "./SchedulerPresenter.js";
import {
    schedulerItemsRepositoryFactory,
    SchedulerItemsRepositoryWithLoading,
    searchRepositoryFactory,
    selectedItemsRepositoryFactory,
    SortingRepositoryWithDefaults
} from "~/Domain/index.js";
import type {
    ICancelScheduledActionGateway,
    IGetScheduledActionGateway,
    IListScheduledActionsGateway,
    ISchedulePublishActionGateway,
    IScheduleUnpublishActionGateway
} from "~/Gateways/index.js";
import { SchedulerControllers } from "~/Presentation/Scheduler/SchedulerControllers.js";

export interface SchedulerProps {
    namespace: string;
    getGateway: IGetScheduledActionGateway;
    listGateway: IListScheduledActionsGateway;
    cancelGateway: ICancelScheduledActionGateway;
    publishGateway: ISchedulePublishActionGateway;
    unpublishGateway: IScheduleUnpublishActionGateway;
    onClose: () => void;
    sorting: Sorting[];
    title: string;
}

export const Scheduler = observer((props: SchedulerProps) => {
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
        const schedulerItemsRepository = schedulerItemsRepositoryFactory.getRepository({
            metaRepository,
            getGateway: props.getGateway,
            cancelGateway: props.cancelGateway,
            publishGateway: props.publishGateway,
            unpublishGateway: props.unpublishGateway,
            listGateway: props.listGateway,
            namespace: props.namespace
        });

        return new SchedulerItemsRepositoryWithLoading(loadingRepository, schedulerItemsRepository);
    }, [
        metaRepository,
        loadingRepository,
        props.listGateway,
        props.cancelGateway,
        props.publishGateway,
        props.unpublishGateway,
        props.listGateway,
        props.namespace
    ]);

    const controllers = useMemo(() => {
        return new SchedulerControllers({
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
        return new SchedulerPresenter({
            itemsRepository,
            selectedRepository,
            sortingRepository,
            searchRepository
        });
    }, [itemsRepository, selectedRepository, sortingRepository, searchRepository]);

    useEffect(() => {
        controllers.listItems.execute();
    }, []);

    return (
        <SchedulerProvider namespace={props.namespace} controllers={controllers} presenter={presenter}>
            <SchedulerOverlay onExited={props.onClose} title={props.title} />
        </SchedulerProvider>
    );
});
