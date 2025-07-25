import { makeAutoObservable, runInAction } from "mobx";
import uniqBy from "lodash/uniqBy";
import { SchedulerItem } from "~/Domain";
import {
    ISchedulerCancelGateway,
    type ISchedulerListExecuteParams,
    ISchedulerListGateway,
    ISchedulerPublishGateway,
    ISchedulerUnpublishGateway
} from "~/Gateways";
import { IMetaRepository, Meta } from "@webiny/app-utils";
import { ISchedulerItemsRepository } from "./ISchedulerItemsRepository";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export interface ISchedulerItemsRepositoryParams {
    metaRepository: IMetaRepository;
    listGateway: ISchedulerListGateway;
    cancelGateway: ISchedulerCancelGateway;
    unpublishGateway: ISchedulerUnpublishGateway;
    publishGateway: ISchedulerPublishGateway;
    model: Pick<CmsModel, "modelId">;
}

export class SchedulerItemsRepository implements ISchedulerItemsRepository {
    private metaRepository: IMetaRepository;
    private listGateway: ISchedulerListGateway;
    private cancelGateway: ISchedulerCancelGateway;
    private unpublishGateway: ISchedulerUnpublishGateway;
    private publishGateway: ISchedulerPublishGateway;
    private items: SchedulerItem[] = [];
    private params: ISchedulerListExecuteParams;
    private readonly model: Pick<CmsModel, "modelId">;

    constructor(params: ISchedulerItemsRepositoryParams) {
        this.metaRepository = params.metaRepository;
        this.listGateway = params.listGateway;
        this.cancelGateway = params.cancelGateway;
        this.unpublishGateway = params.unpublishGateway;
        this.publishGateway = params.publishGateway;
        this.model = params.model;
        this.params = {
            modelId: this.model.modelId
        };
        makeAutoObservable(this);
    }

    getItems() {
        return this.items;
    }

    getMeta() {
        return this.metaRepository.get();
    }

    getLoading() {
        return {};
    }

    async listItems(params: Omit<ISchedulerListExecuteParams, "modelId">) {
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

    async listMoreItems() {
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

    async scheduleCancelItem(id: string) {
        await this.cancelGateway.execute({
            id
        });

        runInAction(() => {
            this.items = this.items.filter(item => item.id !== id);
            this.metaRepository.decreaseTotalCount(1);
        });
    }

    async schedulePublishItem(id: string, scheduleOn: Date) {
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

    async scheduleUnpublishItem(id: string, scheduleOn: Date) {
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
