import type { CreatePageParams, ICreatePageUseCase } from "./ICreatePageUseCase.js";
import { ICreatePageRepository } from "./ICreatePageRepository.js";
import { Page } from "~/domains/Page/index.js";

export class CreatePageUseCase implements ICreatePageUseCase {
    private repository: ICreatePageRepository;

    constructor(repository: ICreatePageRepository) {
        this.repository = repository;
    }

    async execute(params: CreatePageParams) {
        await this.repository.execute(
            Page.create({
                location: params.location,
                properties: params.properties,
                metadata: params.metadata,
                elements: params.elements,
                bindings: params.bindings,
                extensions: params.extensions
            })
        );
    }
}
