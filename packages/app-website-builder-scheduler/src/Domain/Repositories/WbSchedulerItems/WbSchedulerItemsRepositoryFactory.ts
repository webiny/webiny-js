import type { IMetaRepository } from "@webiny/app-utils";
import type { IWbSchedulerListGateway } from "~/Gateways/index.js";
import {
    type IWbSchedulerCancelGateway,
    type IWbSchedulerGetGateway,
    type IWbSchedulerPublishGateway,
    type IWbSchedulerUnpublishGateway
} from "~/Gateways/index.js";
import { WbSchedulerItemsRepository } from "./WbSchedulerItemsRepository.js";

export interface IWbSchedulerItemsRepositoryFactoryGetParams {
    metaRepository: IMetaRepository;
    getGateway: IWbSchedulerGetGateway;
    listGateway: IWbSchedulerListGateway;
    cancelGateway: IWbSchedulerCancelGateway;
    publishGateway: IWbSchedulerPublishGateway;
    unpublishGateway: IWbSchedulerUnpublishGateway;
    targetId: string;
}

export class WbSchedulerItemsRepositoryFactory {
    private readonly cache: Map<string, WbSchedulerItemsRepository> = new Map();

    public getRepository(params: IWbSchedulerItemsRepositoryFactoryGetParams) {
        const cacheKey = this.getCacheKey(params);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new WbSchedulerItemsRepository(params));
        }

        return this.cache.get(cacheKey) as WbSchedulerItemsRepository;
    }

    private getCacheKey(params: IWbSchedulerItemsRepositoryFactoryGetParams) {
        return params.targetId;
    }
}

export const wbSchedulerItemsRepositoryFactory = new WbSchedulerItemsRepositoryFactory();
