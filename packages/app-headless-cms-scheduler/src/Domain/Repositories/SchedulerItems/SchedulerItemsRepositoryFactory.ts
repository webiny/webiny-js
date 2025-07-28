import { IMetaRepository } from "@webiny/app-utils";
import {
    type ISchedulerCancelGateway,
    type ISchedulerGetGateway,
    ISchedulerListGateway,
    type ISchedulerPublishGateway,
    type ISchedulerUnpublishGateway
} from "~/Gateways";
import { SchedulerItemsRepository } from "./SchedulerItemsRepository";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export interface ISchedulerItemsRepositoryFactoryGetParams {
    metaRepository: IMetaRepository;
    getGateway: ISchedulerGetGateway;
    listGateway: ISchedulerListGateway;
    cancelGateway: ISchedulerCancelGateway;
    publishGateway: ISchedulerPublishGateway;
    unpublishGateway: ISchedulerUnpublishGateway;
    model: Pick<CmsModel, "modelId">;
}

export class SchedulerItemsRepositoryFactory {
    private readonly cache: Map<string, SchedulerItemsRepository> = new Map();

    public getRepository(params: ISchedulerItemsRepositoryFactoryGetParams) {
        const cacheKey = this.getCacheKey();

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new SchedulerItemsRepository(params));
        }

        return this.cache.get(cacheKey) as SchedulerItemsRepository;
    }

    private getCacheKey() {
        return Date.now().toString();
    }
}

export const schedulerItemsRepositoryFactory = new SchedulerItemsRepositoryFactory();
