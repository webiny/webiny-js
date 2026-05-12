import { CreatePageUseCase as UseCaseAbstraction, CreatePageRepository } from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";

class CreatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreatePageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        return await this.repository.execute(
            Page.create({
                location: params.location,
                properties: params.properties,
                metadata: params.metadata,
                elements: params.elements,
                bindings: params.bindings,
                extensions: params.extensions,
                live: null,
                system: null,
                revisionDescription: undefined
            })
        );
    }
}

export const CreatePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreatePageUseCaseImpl,
    dependencies: [CreatePageRepository]
});
