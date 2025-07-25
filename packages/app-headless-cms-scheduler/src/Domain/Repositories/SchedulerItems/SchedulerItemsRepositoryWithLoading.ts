import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "@webiny/app-utils";
import { ISchedulerItemsRepository } from "./ISchedulerItemsRepository";
import { LoadingActions } from "~/types";
import type { ISchedulerListExecuteParams } from "~/Gateways/index.js";

export class SchedulerItemsRepositoryWithLoading implements ISchedulerItemsRepository {
    private loadingRepository: ILoadingRepository;
    private schedulerItemsRepository: ISchedulerItemsRepository;

    constructor(
        loadingRepository: ILoadingRepository,
        schedulerItemsRepository: ISchedulerItemsRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.schedulerItemsRepository = schedulerItemsRepository;
        makeAutoObservable(this);
    }

    getItems() {
        return this.schedulerItemsRepository.getItems();
    }

    getMeta() {
        return this.schedulerItemsRepository.getMeta();
    }

    getLoading() {
        return this.loadingRepository.get();
    }

    async listItems(params: Omit<ISchedulerListExecuteParams, "modelId">) {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.listItems(params),
            LoadingActions.list
        );
    }

    async listMoreItems() {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.listMoreItems(),
            LoadingActions.listMore
        );
    }

    async scheduleCancelItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.scheduleCancelItem(id),
            LoadingActions.delete
        );
    }

    async schedulePublishItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.scheduleCancelItem(id),
            LoadingActions.create
        );
    }

    async scheduleUnpublishItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.scheduleCancelItem(id),
            LoadingActions.create
        );
    }
}
