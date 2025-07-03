import { IUpdatePageUseCase, type UpdatePageParams } from "./IUpdatePageUseCase.js";
import { IUpdatePageRepository } from "./IUpdatePageRepository.js";
import { Page } from "~/features/pages/Page.js";

export class UpdatePageUseCase implements IUpdatePageUseCase {
    private repository: IUpdatePageRepository;

    constructor(repository: IUpdatePageRepository) {
        this.repository = repository;
    }

    async execute(params: UpdatePageParams) {
        await this.repository.execute(
            Page.create({
                id: params.id,
                entryId: params.entryId,
                status: params.status,
                wbyAco_location: params.wbyAco_location,
                properties: params.properties,
                bindings: params.bindings,
                elements: params.elements,
                extensions: params.extensions
            })
        );
    }
}
