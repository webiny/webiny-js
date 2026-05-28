import {
    UpdatePageRevisionDescriptionGateway,
    UpdatePageRevisionDescriptionRepository as RepositoryAbstraction
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import { FullPageCache, PageListCache } from "~/features/pages/shared/abstractions.js";

class UpdatePageRevisionDescriptionRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private listCache: PageListCache.Interface,
        private detailsCache: FullPageCache.Interface,
        private gateway: UpdatePageRevisionDescriptionGateway.Interface
    ) {}

    public async execute(id: string, revisionDescription: string | undefined) {
        const result = await this.gateway.execute(id, revisionDescription);

        this.listCache.updateItems(existingPage => {
            if (existingPage.id === id) {
                return Page.create(result);
            }
            return existingPage;
        });

        this.detailsCache.updateItems(existingPage => {
            if (existingPage.id === id) {
                return Page.create({
                    ...result
                });
            }
            return existingPage;
        });
    }
}

export const UpdatePageRevisionDescriptionRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdatePageRevisionDescriptionRepositoryImpl,
    dependencies: [PageListCache, FullPageCache, UpdatePageRevisionDescriptionGateway]
});
