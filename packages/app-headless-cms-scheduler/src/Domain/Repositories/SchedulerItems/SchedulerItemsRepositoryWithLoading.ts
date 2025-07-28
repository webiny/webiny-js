import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "@webiny/app-utils";
import { ISchedulerItemsRepository } from "./ISchedulerItemsRepository";
import { LoadingActions } from "~/types";
import type { ISchedulerGetExecuteParams, ISchedulerListExecuteParams } from "~/Gateways/index.js";

export class SchedulerItemsRepositoryWithLoading implements ISchedulerItemsRepository {
    private readonly loadingRepository: ILoadingRepository;
    private readonly schedulerItemsRepository: ISchedulerItemsRepository;

    public constructor(
        loadingRepository: ILoadingRepository,
        schedulerItemsRepository: ISchedulerItemsRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.schedulerItemsRepository = schedulerItemsRepository;
        makeAutoObservable(this);
    }

    public getItems() {
        return this.schedulerItemsRepository.getItems();
    }

    public getMeta() {
        return this.schedulerItemsRepository.getMeta();
    }

    public getLoading() {
        return this.loadingRepository.get();
    }

    public async getItem(params: Omit<ISchedulerGetExecuteParams, "modelId">) {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.getItem(params),
            LoadingActions.get
        );
    }

    public async listItems(params: Omit<ISchedulerListExecuteParams, "modelId">) {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.listItems(params),
            LoadingActions.list
        );
    }

    public async listMoreItems() {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.listMoreItems(),
            LoadingActions.listMore
        );
    }

    public async scheduleCancelItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.scheduleCancelItem(id),
            LoadingActions.delete
        );
    }

    public async schedulePublishItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.scheduleCancelItem(id),
            LoadingActions.create
        );
    }

    public async scheduleUnpublishItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.schedulerItemsRepository.scheduleCancelItem(id),
            LoadingActions.create
        );
    }
}
