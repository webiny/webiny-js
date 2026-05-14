import { makeAutoObservable, runInAction } from "mobx";
import {
    ListWebhooksGateway,
    ListWebhooksRepository as RepositoryAbstraction
} from "./abstractions.js";
import type { IListWebhooksInput, IListWebhooksOutput } from "~/admin/domain/types.js";

class ListWebhooksRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: ListWebhooksGateway.Interface) {
        makeAutoObservable(this);
    }

    async execute(input: IListWebhooksInput): Promise<IListWebhooksOutput> {
        const result = await this.gateway.execute(input);
        return runInAction(() => result);
    }
}

export const ListWebhooksRepository = RepositoryAbstraction.createImplementation({
    implementation: ListWebhooksRepositoryImpl,
    dependencies: [ListWebhooksGateway]
});
