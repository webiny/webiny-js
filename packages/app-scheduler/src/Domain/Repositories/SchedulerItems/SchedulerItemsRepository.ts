import { makeAutoObservable, runInAction } from "mobx";
import uniqBy from "lodash/uniqBy.js";
import type { SchedulerItem } from "~/Domain/index.js";
import type {
    ISchedulerCancelGateway,
    ISchedulerListGateway,
    ISchedulerPublishGateway,
    ISchedulerUnpublishGateway
} from "~/Gateways/index.js";
import {
    type ISchedulerGetExecuteParams,
    type ISchedulerGetGateway,
    type ISchedulerListExecuteParams
} from "~/Gateways/index.js";
import type { IMetaRepository } from "@webiny/app-utils";
import { Meta } from "@webiny/app-utils";
import type { ISchedulerItemsRepository } from "./ISchedulerItemsRepository.js";

export interface ISchedulerItemsRepositoryParams {
    metaRepository: IMetaRepository;
    getGateway: ISchedulerGetGateway;
    listGateway: ISchedulerListGateway;
    cancelGateway: ISchedulerCancelGateway;
    unpublishGateway: ISchedulerUnpublishGateway;
    publishGateway: ISchedulerPublishGateway;
    app: string;
}

export class SchedulerItemsRepository implements ISchedulerItemsRepository {
    private readonly metaRepository: IMetaRepository;
    private readonly getGateway: ISchedulerGetGateway;
    private readonly listGateway: ISchedulerListGateway;
    private readonly cancelGateway: ISchedulerCancelGateway;
    private readonly unpublishGateway: ISchedulerUnpublishGateway;
    private readonly publishGateway: ISchedulerPublishGateway;
    private readonly app: string;
    private items: SchedulerItem[] = [];
    private params: ISchedulerListExecuteParams;

    public constructor(params: ISchedulerItemsRepositoryParams) {
        this.metaRepository = params.metaRepository;
        this.listGateway = params.listGateway;
        this.getGateway = params.getGateway;
        this.cancelGateway = params.cancelGateway;
        this.unpublishGateway = params.unpublishGateway;
        this.publishGateway = params.publishGateway;
        this.app = params.app;
        this.params = {
            app: this.app
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

    public async getItem(params: Omit<ISchedulerGetExecuteParams, "app">) {
        const item = await this.getGateway.execute({
            id: params.id,
            app: this.app
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

    public async listItems(params?: Omit<ISchedulerListExecuteParams, "app">) {
        this.params = {
            where: params?.where,
            limit: params?.limit,
            sort: params?.sort,
            after: params?.after,
            app: this.app
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
            app: this.app,
            id
        });

        runInAction(() => {
            this.items = this.items.filter(item => item.id !== id);
            this.metaRepository.decreaseTotalCount(1);
        });
    }

    public async schedulePublishItem(id: string, scheduleOn: Date) {
        const { item } = await this.publishGateway.execute({
            app: this.app,
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
            app: this.app,
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
