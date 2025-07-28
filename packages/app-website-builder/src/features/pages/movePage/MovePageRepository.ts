import type { IMovePageRepository } from "~/features/pages/movePage/IMovePageRepository.js";
import type { IMovePageGateway } from "~/features/pages/movePage/IMovePageGateway.js";
import { type IListCache, Page } from "~/domain/Page/index.js";

export class MovePageRepository implements IMovePageRepository {
    private cache: IListCache<Page>;
    private gateway: IMovePageGateway;

    constructor(cache: IListCache<Page>, gateway: IMovePageGateway) {
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

            return p;
        });
    }
}
