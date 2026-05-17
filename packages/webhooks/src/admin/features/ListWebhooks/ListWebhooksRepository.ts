import {
    ListWebhooksGateway,
    ListWebhooksRepository as RepositoryAbstraction,
    type IListWebhooksInput,
    type IListWebhooksOutput
} from "./abstractions.js";

class ListWebhooksRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private readonly gateway: ListWebhooksGateway.Interface) {}

    async execute(input: IListWebhooksInput): Promise<IListWebhooksOutput> {
        return this.gateway.execute(input);
    }
}

export const ListWebhooksRepository = RepositoryAbstraction.createImplementation({
    implementation: ListWebhooksRepositoryImpl,
    dependencies: [ListWebhooksGateway]
});
