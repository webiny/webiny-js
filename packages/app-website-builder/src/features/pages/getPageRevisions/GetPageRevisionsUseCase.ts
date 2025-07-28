import type {
    GetPageRevisionsParams,
    IGetPageRevisionsUseCase
} from "./IGetPageRevisionsUseCase.js";
import type { IGetPageRevisionsRepository } from "./IGetPageRevisionsRepository.js";

export class GetPageRevisionsUseCase implements IGetPageRevisionsUseCase {
    private repository: IGetPageRevisionsRepository;

    constructor(repository: IGetPageRevisionsRepository) {
        this.repository = repository;
    }

    async execute(params: GetPageRevisionsParams) {
        return await this.repository.execute(params.entryId);
    }
}
