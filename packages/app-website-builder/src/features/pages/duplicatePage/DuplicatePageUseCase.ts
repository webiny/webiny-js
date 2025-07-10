import type {
    DuplicatePageParams,
    IDuplicatePageUseCase
} from "~/features/pages/duplicatePage/IDuplicatePageUseCase.js";
import type { IDuplicatePageRepository } from "~/features/pages/duplicatePage/IDuplicatePageRepository.js";
import { Page } from "~/domain/Page/index.js";

export class DuplicatePageUseCase implements IDuplicatePageUseCase {
    private repository: IDuplicatePageRepository;

    constructor(repository: IDuplicatePageRepository) {
        this.repository = repository;
    }

    async execute(params: DuplicatePageParams) {
        await this.repository.execute(
            Page.create({
                id: params.id
            })
        );
    }
}
