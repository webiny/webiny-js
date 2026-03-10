import { makeAutoObservable } from "mobx";
import type { ILoadingRepository } from "@webiny/app-utils";
import type { IWbSchedulerItemsRepository } from "./IWbSchedulerItemsRepository.js";
import { LoadingActions } from "~/types.js";
import type {
    IWbSchedulerGetExecuteParams,
    IWbSchedulerListExecuteParams
} from "~/Gateways/index.js";

export class WbSchedulerItemsRepositoryWithLoading implements IWbSchedulerItemsRepository {
    private readonly loadingRepository: ILoadingRepository;
    private readonly wbSchedulerItemsRepository: IWbSchedulerItemsRepository;

    public constructor(
        loadingRepository: ILoadingRepository,
        wbSchedulerItemsRepository: IWbSchedulerItemsRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.wbSchedulerItemsRepository = wbSchedulerItemsRepository;
        makeAutoObservable(this);
    }

    public getItems() {
        return this.wbSchedulerItemsRepository.getItems();
    }

    public getMeta() {
        return this.wbSchedulerItemsRepository.getMeta();
    }

    public getLoading() {
        return this.loadingRepository.get();
    }

    public async getItem(params: Omit<IWbSchedulerGetExecuteParams, "modelId">) {
        await this.loadingRepository.runCallBack(
            this.wbSchedulerItemsRepository.getItem(params),
            LoadingActions.get
        );
    }

    public async listItems(params: Omit<IWbSchedulerListExecuteParams, "modelId">) {
        await this.loadingRepository.runCallBack(
            this.wbSchedulerItemsRepository.listItems(params),
            LoadingActions.list
        );
    }

    public async listMoreItems() {
        await this.loadingRepository.runCallBack(
            this.wbSchedulerItemsRepository.listMoreItems(),
            LoadingActions.listMore
        );
    }

    public async scheduleCancelItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.wbSchedulerItemsRepository.scheduleCancelItem(id),
            LoadingActions.delete
        );
    }

    public async schedulePublishItem(id: string, scheduleOn: Date): Promise<void> {
        await this.loadingRepository.runCallBack(
            this.wbSchedulerItemsRepository.schedulePublishItem(id, scheduleOn),
            LoadingActions.create
        );
    }

    public async scheduleUnpublishItem(id: string, scheduleOn: Date): Promise<void> {
        await this.loadingRepository.runCallBack(
            this.wbSchedulerItemsRepository.scheduleUnpublishItem(id, scheduleOn),
            LoadingActions.create
        );
    }
}
