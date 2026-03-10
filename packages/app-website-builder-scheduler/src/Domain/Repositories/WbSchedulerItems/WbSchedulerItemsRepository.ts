import { makeAutoObservable, runInAction } from "mobx";
import uniqBy from "lodash/uniqBy.js";
import type { WbSchedulerItem } from "~/Domain/index.js";
import { WbSchedulerItem as WbSchedulerItemModel } from "~/Domain/index.js";
import type {
    IWbSchedulerCancelGateway,
    IWbSchedulerListGateway,
    IWbSchedulerPublishGateway,
    IWbSchedulerUnpublishGateway
} from "~/Gateways/index.js";
import {
    type IWbSchedulerGetExecuteParams,
    type IWbSchedulerGetGateway,
    type IWbSchedulerListExecuteParams
} from "~/Gateways/index.js";
import type { IMetaRepository } from "@webiny/app-utils";
import { Meta } from "@webiny/app-utils";
import type { IWbSchedulerItemsRepository } from "./IWbSchedulerItemsRepository.js";
import { LoadingActions } from "~/types.js";

const PAGE_MODEL_ID = "page";

export interface IWbSchedulerItemsRepositoryParams {
    metaRepository: IMetaRepository;
    getGateway: IWbSchedulerGetGateway;
    listGateway: IWbSchedulerListGateway;
    cancelGateway: IWbSchedulerCancelGateway;
    unpublishGateway: IWbSchedulerUnpublishGateway;
    publishGateway: IWbSchedulerPublishGateway;
    targetId: string;
}

export class WbSchedulerItemsRepository implements IWbSchedulerItemsRepository {
    private readonly metaRepository: IMetaRepository;
    private readonly getGateway: IWbSchedulerGetGateway;
    private readonly listGateway: IWbSchedulerListGateway;
    private readonly cancelGateway: IWbSchedulerCancelGateway;
    private readonly unpublishGateway: IWbSchedulerUnpublishGateway;
    private readonly publishGateway: IWbSchedulerPublishGateway;
    private readonly targetId: string;
    private items: WbSchedulerItem[] = [];
    private params: IWbSchedulerListExecuteParams;

    public constructor(params: IWbSchedulerItemsRepositoryParams) {
        this.metaRepository = params.metaRepository;
        this.listGateway = params.listGateway;
        this.getGateway = params.getGateway;
        this.cancelGateway = params.cancelGateway;
        this.unpublishGateway = params.unpublishGateway;
        this.publishGateway = params.publishGateway;
        this.targetId = params.targetId;
        this.params = {
            modelId: PAGE_MODEL_ID
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
        return {
            [LoadingActions.get]: false,
            [LoadingActions.list]: false,
            [LoadingActions.listMore]: false,
            [LoadingActions.delete]: false,
            [LoadingActions.create]: false
        };
    }

    public async getItem(params: Omit<IWbSchedulerGetExecuteParams, "modelId">) {
        const item = await this.getGateway.execute({
            ...params,
            modelId: PAGE_MODEL_ID
        });
        runInAction(() => {
            this.items = item ? [WbSchedulerItemModel.create(item)] : [];
        });
    }

    public async listItems(params: Omit<IWbSchedulerListExecuteParams, "modelId">) {
        this.params = {
            ...params,
            where: {
                ...params.where,
                targetId: this.targetId
            },
            modelId: PAGE_MODEL_ID
        };

        const response = await this.listGateway.execute({ ...this.params });

        if (!response) {
            return;
        }

        runInAction(() => {
            this.items = response.items.map(entry => WbSchedulerItemModel.create(entry));
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
            this.items = uniqBy(
                [...this.items, ...response.items.map(entry => WbSchedulerItemModel.create(entry))],
                "id"
            );
            this.metaRepository.set(Meta.create(response.meta));
        });
    }

    public async scheduleCancelItem(id: string) {
        await this.cancelGateway.execute({
            modelId: PAGE_MODEL_ID,
            id
        });

        runInAction(() => {
            this.items = this.items.filter(item => item.id !== id);
            this.metaRepository.decreaseTotalCount(1);
        });
    }

    public async schedulePublishItem(id: string, scheduleOn: Date) {
        const { item } = await this.publishGateway.execute({
            modelId: PAGE_MODEL_ID,
            id,
            scheduleOn
        });

        if (!item) {
            return;
        }

        runInAction(() => {
            this.items = [...this.items, WbSchedulerItemModel.create(item)];
            this.metaRepository.increaseTotalCount(1);
        });
    }

    public async scheduleUnpublishItem(id: string, scheduleOn: Date) {
        const { item } = await this.unpublishGateway.execute({
            modelId: PAGE_MODEL_ID,
            id,
            scheduleOn
        });

        if (!item) {
            return;
        }

        runInAction(() => {
            this.items = [...this.items, WbSchedulerItemModel.create(item)];
            this.metaRepository.increaseTotalCount(1);
        });
    }
}
