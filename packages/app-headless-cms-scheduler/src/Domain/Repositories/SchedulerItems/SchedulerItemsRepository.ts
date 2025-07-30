import { makeAutoObservable, runInAction } from "mobx";
import uniqBy from "lodash/uniqBy";
import type { SchedulerItem } from "~/Domain";
import type {
    ISchedulerCancelGateway,
    ISchedulerListGateway,
    ISchedulerPublishGateway,
    ISchedulerUnpublishGateway
} from "~/Gateways";
import {
    type ISchedulerGetExecuteParams,
    type ISchedulerGetGateway,
    type ISchedulerListExecuteParams
} from "~/Gateways";
import type { IMetaRepository } from "@webiny/app-utils";
import { Meta } from "@webiny/app-utils";
import type { ISchedulerItemsRepository } from "./ISchedulerItemsRepository";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export interface ISchedulerItemsRepositoryParams {
    metaRepository: IMetaRepository;
    getGateway: ISchedulerGetGateway;
    listGateway: ISchedulerListGateway;
    cancelGateway: ISchedulerCancelGateway;
    unpublishGateway: ISchedulerUnpublishGateway;
    publishGateway: ISchedulerPublishGateway;
    model: Pick<CmsModel, "modelId">;
}

export class SchedulerItemsRepository implements ISchedulerItemsRepository {
    private readonly metaRepository: IMetaRepository;
    private readonly getGateway: ISchedulerGetGateway;
    private readonly listGateway: ISchedulerListGateway;
    private readonly cancelGateway: ISchedulerCancelGateway;
    private readonly unpublishGateway: ISchedulerUnpublishGateway;
    private readonly publishGateway: ISchedulerPublishGateway;
    private readonly model: Pick<CmsModel, "modelId">;
    private items: SchedulerItem[] = [];
    private params: ISchedulerListExecuteParams;

    public constructor(params: ISchedulerItemsRepositoryParams) {
        this.metaRepository = params.metaRepository;
        this.listGateway = params.listGateway;
        this.getGateway = params.getGateway;
        this.cancelGateway = params.cancelGateway;
        this.unpublishGateway = params.unpublishGateway;
        this.publishGateway = params.publishGateway;
        this.model = params.model;
        this.params = {
            modelId: this.model.modelId
        };
        makeAutoObservable(this);
    }

    public getItems() {
        return this.items;
    }

    public getMeta() {
        return this.metaRepository.get();
    }

    public getLoading() {
        return {};
    }

    public async getItem(params: Omit<ISchedulerGetExecuteParams, "modelId">) {
        const item = await this.getGateway.execute({
            ...params,
            modelId: this.model.modelId
        });
        /**
         * TODO Do we want to reset the items list?
         */
        runInAction(() => {
            this.items = [];
        });

        if (!item) {
            return;
        }

        runInAction(() => {
            this.items = [item];
        });
    }

    public async listItems(params: Omit<ISchedulerListExecuteParams, "modelId">) {
        this.params = {
            ...params,
            modelId: this.model.modelId
        };

        const response = await this.listGateway.execute({ ...this.params });

        if (!response) {
            return;
        }

        runInAction(() => {
            this.items = response.items;
            this.metaRepository.set(Meta.create(response.meta));
        });
    }

    public async listMoreItems() {
        const { cursor } = this.metaRepository.get();

        if (!cursor) {
            return;
        }

        const response = await this.listGateway.execute({ ...this.params, after: cursor });

        if (!response) {
            return;
        }

        runInAction(() => {
            this.items = uniqBy([...this.items, ...response.items], "id");
            this.metaRepository.set(Meta.create(response.meta));
        });
    }

    public async scheduleCancelItem(id: string) {
        await this.cancelGateway.execute({
            modelId: this.model.modelId,
            id
        });

        runInAction(() => {
            this.items = this.items.filter(item => item.id !== id);
            this.metaRepository.decreaseTotalCount(1);
        });
    }

    public async schedulePublishItem(id: string, scheduleOn: Date) {
        const { item } = await this.publishGateway.execute({
            modelId: this.model.modelId,
            id,
            scheduleOn
        });

        if (!item) {
            return;
        }

        runInAction(() => {
            this.items = [...this.items, item];
            this.metaRepository.increaseTotalCount(1);
        });
    }

    public async scheduleUnpublishItem(id: string, scheduleOn: Date) {
        const { item } = await this.unpublishGateway.execute({
            modelId: this.model.modelId,
            id,
            scheduleOn
        });

        if (!item) {
            return;
        }

        runInAction(() => {
            this.items = [...this.items, item];
            this.metaRepository.increaseTotalCount(1);
        });
    }
}
