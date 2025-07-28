import type {
    ILoadRedirectsUseCase,
    LoadRedirectsUseCaseParams
} from "~/features/redirects/loadRedirects/ILoadRedirectsUseCase.js";
import type { IListRedirectsRepository } from "~/features/redirects/loadRedirects/IListRedirectsRepository.js";

export class LoadRedirectsUseCase implements ILoadRedirectsUseCase {
    private repository: IListRedirectsRepository;

    constructor(repository: IListRedirectsRepository) {
        this.repository = repository;
    }

    async execute({ folderId, resetSearch }: LoadRedirectsUseCaseParams) {
        const params = {
            where: {
                wbyAco_location: {
                    folderId
                }
            },
            resetSearch
        };

        await this.repository.loadRedirects(params);
    }
}
