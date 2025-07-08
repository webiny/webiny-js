import type { IListMorePagesUseCase } from "~/features/pages/listPages/IListMorePagesUseCase.js";
import { IListPagesRepository } from "~/features/pages/listPages/IListPagesRepository.js";
import type { IMetaRepository } from "@webiny/app-utils";

export class ListMorePagesUseCase implements IListMorePagesUseCase {
    private repository: IListPagesRepository;
    private metaRepository: IMetaRepository;

    constructor(repository: IListPagesRepository, metaRepository: IMetaRepository) {
        this.repository = repository;
        this.metaRepository = metaRepository;
    }

    async execute() {
        const after = this.metaRepository.get().cursor;

        if (after) {
            await this.repository.execute({
                after
            });
        }
    }
}
