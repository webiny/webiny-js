import { ListCache } from "~/features/pages/cache/index.js";
import { Page } from "~/features/pages/Page.js";
import type { IMovePageRepository } from "~/features/pages/movePage/IMovePageRepository.js";
import type { IMovePageGateway } from "~/features/pages/movePage/IMovePageGateway.js";

export class MovePageRepository implements IMovePageRepository {
    private cache: ListCache<Page>;
    private gateway: IMovePageGateway;

    constructor(cache: ListCache<Page>, gateway: IMovePageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

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

            return Page.create(p);
        });
    }
}
