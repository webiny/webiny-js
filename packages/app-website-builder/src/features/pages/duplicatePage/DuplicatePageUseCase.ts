import { Page } from "~/features/pages/Page.js";
import type {
    DuplicatePageParams,
    IDuplicatePageUseCase
} from "~/features/pages/duplicatePage/IDuplicatePageUseCase.js";
import type { IDuplicatePageRepository } from "~/features/pages/duplicatePage/IDuplicatePageRepository.js";

export class DuplicatePageUseCase implements IDuplicatePageUseCase {
    private repository: IDuplicatePageRepository;

    constructor(repository: IDuplicatePageRepository) {
        this.repository = repository;
    }

    async execute(params: DuplicatePageParams) {
        await this.repository.execute(
            Page.create({
                id: params.id,
                entryId: params.id,
                status: params.status,
                location: params.location,
                properties: params.properties,
                bindings: params.bindings,
                elements: params.elements,
                extensions: params.extensions
            })
        );
    }
}
