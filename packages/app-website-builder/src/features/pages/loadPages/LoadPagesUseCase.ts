import type {
    ILoadPagesUseCase,
    LoadPagesUseCaseParams
} from "~/features/pages/loadPages/ILoadPagesUseCase.js";
import type { ILoadPagesRepository } from "~/features/pages/loadPages/ILoadPagesRepository.js";

export class LoadPagesUseCase implements ILoadPagesUseCase {
    private repository: ILoadPagesRepository;

    constructor(repository: ILoadPagesRepository) {
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
