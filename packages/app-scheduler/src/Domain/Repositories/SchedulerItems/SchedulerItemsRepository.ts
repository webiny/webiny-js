import { makeAutoObservable, runInAction } from "mobx";
import uniqBy from "lodash/uniqBy.js";
import type { SchedulerItem } from "~/Domain/index.js";
import type {
    ICancelScheduleActionGateway,
    IListScheduleActionsGateway,
    ISchedulePublishActionGateway,
    IScheduleUnpublishActionGateway
} from "~/Gateways/index.js";
import {
    type IGetScheduleActionGatewayExecuteParams,
    type IGetScheduleActionGateway,
    type IListScheduleActionsGatewayExecuteParams
} from "~/Gateways/index.js";
import type { IMetaRepository } from "@webiny/app-utils";
import { Meta } from "@webiny/app-utils";
import type { ISchedulerItemsRepository } from "./ISchedulerItemsRepository.js";

export interface ISchedulerItemsRepositoryParams {
    metaRepository: IMetaRepository;
    getGateway: IGetScheduleActionGateway;
    listGateway: IListScheduleActionsGateway;
    cancelGateway: ICancelScheduleActionGateway;
    unpublishGateway: IScheduleUnpublishActionGateway;
    publishGateway: ISchedulePublishActionGateway;
    app: string;
}

export class SchedulerItemsRepository implements ISchedulerItemsRepository {
    private readonly metaRepository: IMetaRepository;
    private readonly getGateway: IGetScheduleActionGateway;
    private readonly listGateway: IListScheduleActionsGateway;
    private readonly cancelGateway: ICancelScheduleActionGateway;
    private readonly unpublishGateway: IScheduleUnpublishActionGateway;
    private readonly publishGateway: ISchedulePublishActionGateway;
    private readonly app: string;
    private items: SchedulerItem[] = [];
    private params: IListScheduleActionsGatewayExecuteParams;

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

    public async getItem(params: Omit<IGetScheduleActionGatewayExecuteParams, "app">) {
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

    public async listItems(params?: Omit<IListScheduleActionsGatewayExecuteParams, "app">) {
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
