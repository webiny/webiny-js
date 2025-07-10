import { IUpdatePageUseCase, type UpdatePageParams } from "./IUpdatePageUseCase.js";
import { IUpdatePageRepository } from "./IUpdatePageRepository.js";
import { Page } from "~/domain/Page/index.js";

export class UpdatePageUseCase implements IUpdatePageUseCase {
    private repository: IUpdatePageRepository;

    constructor(repository: IUpdatePageRepository) {
        this.repository = repository;
    }

    async execute(params: UpdatePageParams) {
        await this.repository.execute(
            Page.create({
                id: params.id,
                properties: params.properties,
                metadata: params.metadata,
                bindings: params.bindings,
                elements: params.elements,
                extensions: params.extensions
            })
        );
    }
}
