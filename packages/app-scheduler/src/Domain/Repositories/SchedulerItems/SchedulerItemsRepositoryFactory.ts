import type { IMetaRepository } from "@webiny/app-utils";
import type { IListScheduleActionsGateway } from "~/Gateways/index.js";
import {
    type ICancelScheduleActionGateway,
    type IGetScheduleActionGateway,
    type ISchedulePublishActionGateway,
    type IScheduleUnpublishActionGateway
} from "~/Gateways/index.js";
import { SchedulerItemsRepository } from "./SchedulerItemsRepository.js";

export interface ISchedulerItemsRepositoryFactoryGetParams {
    metaRepository: IMetaRepository;
    getGateway: IGetScheduleActionGateway;
    listGateway: IListScheduleActionsGateway;
    cancelGateway: ICancelScheduleActionGateway;
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
