import type {
    ILoadPagesUseCase,
    LoadPagesUseCaseParams
} from "~/features/pages/loadPages/ILoadPagesUseCase.js";
import type { IListPagesRepository } from "~/features/pages/loadPages/IListPagesRepository.js";

export class LoadPagesUseCase implements ILoadPagesUseCase {
    private repository: IListPagesRepository;

    constructor(repository: IListPagesRepository) {
        this.repository = repository;
    }

    async execute({ folderId }: LoadPagesUseCaseParams) {
        const params = {
            where: {
                wbyAco_location: {
                    folderId
                }
            }
        };

        await this.repository.loadPages(params);
    }
}
