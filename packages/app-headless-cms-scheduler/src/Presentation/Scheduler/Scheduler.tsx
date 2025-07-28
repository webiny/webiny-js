import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    Sorting,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { SchedulerProvider } from "../hooks";
import { SchedulerOverlay } from "../components/SchedulerOverlay";
import { SchedulerPresenter } from "./SchedulerPresenter";
import {
    schedulerItemsRepositoryFactory,
    SchedulerItemsRepositoryWithLoading,
    searchRepositoryFactory,
    selectedItemsRepositoryFactory,
    SortingRepositoryWithDefaults
} from "~/Domain";
import type {
    ISchedulerCancelGateway,
    ISchedulerGetGateway,
    ISchedulerListGateway,
    ISchedulerPublishGateway,
    ISchedulerUnpublishGateway
} from "~/Gateways";
import { SchedulerControllers } from "~/Presentation/Scheduler/SchedulerControllers";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export interface SchedulerProps {
    model: Pick<CmsModel, "modelId">;
    getGateway: ISchedulerGetGateway;
    listGateway: ISchedulerListGateway;
    cancelGateway: ISchedulerCancelGateway;
    publishGateway: ISchedulerPublishGateway;
    unpublishGateway: ISchedulerUnpublishGateway;
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
            model: props.model
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
        props.model
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
        <SchedulerProvider controllers={controllers} presenter={presenter}>
            <SchedulerOverlay onExited={props.onClose} title={props.title} />
        </SchedulerProvider>
    );
});
