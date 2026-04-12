import { MovePageRepository as RepositoryAbstraction, MovePageGateway } from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import { PageListCache } from "~/features/pages/shared/abstractions.js";

class MovePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: PageListCache.Interface,
        private gateway: MovePageGateway.Interface
    ) {}

    async execute(id: string, folderId: string): Promise<void> {
        await this.gateway.execute(id, folderId);
        this.cache.updateItems(p => {
            if (p.id === id) {
                return Page.create({
                    ...p,
                    location: {
                        folderId
                    }
                });
            }

            return p;
        });
    }
}

export const MovePageRepository = RepositoryAbstraction.createImplementation({
    implementation: MovePageRepositoryImpl,
    dependencies: [PageListCache, MovePageGateway]
});
