import type { CreatePageParams, ICreatePageUseCase } from "./ICreatePageUseCase.js";
import type { ICreatePageRepository } from "./ICreatePageRepository.js";
import { Page } from "~/domain/Page/index.js";

export class CreatePageUseCase implements ICreatePageUseCase {
    private repository: ICreatePageRepository;

    constructor(repository: ICreatePageRepository) {
        this.repository = repository;
    }

    async execute(params: CreatePageParams) {
        return await this.repository.execute(
            Page.create({
                location: params.location,
                properties: params.properties,
                metadata: params.metadata,
                elements: params.elements,
                bindings: params.bindings,
                extensions: params.extensions,
                live: null,
                system: null
            })
        );
    }
}
