import type { ISearchStateGateway } from "~/features/redirects/loadRedirects/ISearchStateGateway.js";
import type { ISearchRepository } from "~/domain/Search/index.js";

export class SearchRepositoryWithQueryStringGateway implements ISearchRepository {
    private gateway: ISearchStateGateway;
    private decoretee: ISearchRepository;

    constructor(gateway: ISearchStateGateway, decoretee: ISearchRepository) {
        this.gateway = gateway;
        this.decoretee = decoretee;

        // On initialization, sync the repository with the gateway value
        const initialValue = this.gateway.get();
        if (initialValue) {
            // Set the initial value from the gateway into the repository
            this.decoretee.set(initialValue);
        }
    }

    get(): string {
        return this.decoretee.get();
    }

    async set(query: string): Promise<void> {
        await this.decoretee.set(query);
        await this.gateway.set(query);
    }
}
