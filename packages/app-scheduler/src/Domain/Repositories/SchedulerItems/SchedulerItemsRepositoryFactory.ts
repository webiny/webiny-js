import type { IMetaRepository } from "@webiny/app-utils";
import type { IListScheduledActionsGateway } from "~/Gateways/index.js";
import {
    type ICancelScheduledActionGateway,
    type IGetScheduledActionGateway,
    type ISchedulePublishActionGateway,
    type IScheduleUnpublishActionGateway
} from "~/Gateways/index.js";
import { SchedulerItemsRepository } from "./SchedulerItemsRepository.js";

export interface ISchedulerItemsRepositoryFactoryGetParams {
    metaRepository: IMetaRepository;
    getGateway: IGetScheduledActionGateway;
    listGateway: IListScheduledActionsGateway;
    cancelGateway: ICancelScheduledActionGateway;
    publishGateway: ISchedulePublishActionGateway;
    unpublishGateway: IScheduleUnpublishActionGateway;
    namespace: string;
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
