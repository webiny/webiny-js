import type {
    IListPagesRepository,
    IListPagesRepositoryParams
} from "~/features/pages/listPages/IListPagesRepository.js";
import type { IQueryGateway } from "~/features/pages/listPages/IQueryGateway.js";

export class ListPagesRepositoryWithQueryString implements IListPagesRepository {
    private gateway: IQueryGateway;
    private decoretee: IListPagesRepository;

    constructor(gateway: IQueryGateway, decoretee: IListPagesRepository) {
        this.gateway = gateway;
        this.decoretee = decoretee;
    }

    async execute(params?: IListPagesRepositoryParams) {
        await this.gateway.set(params?.search);
        await this.decoretee.execute(params);
    }
}
