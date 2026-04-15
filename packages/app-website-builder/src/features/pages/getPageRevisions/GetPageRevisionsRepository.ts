import {
    GetPageRevisionsRepository as RepositoryAbstraction,
    GetPageRevisionsGateway
} from "./abstractions.js";
import { PageRevision } from "~/domain/PageRevision/PageRevision.js";
import { PageRevisionsCache } from "~/features/pages/shared/abstractions.js";

class GetPageRevisionsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: PageRevisionsCache.Interface,
        private gateway: GetPageRevisionsGateway.Interface
    ) {}

    async execute(pageId: string) {
        const response = await this.gateway.execute(pageId);
        const revisions = response.map(revision => PageRevision.create(revision));
        this.cache.addItems(revisions);
        return revisions;
    }
}

export const GetPageRevisionsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetPageRevisionsRepositoryImpl,
    dependencies: [PageRevisionsCache, GetPageRevisionsGateway]
});
