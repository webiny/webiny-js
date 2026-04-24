import { UpdatePageUseCase as UseCaseAbstraction, UpdatePageRepository } from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";

class UpdatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdatePageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
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

export const UpdatePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdatePageUseCaseImpl,
    dependencies: [UpdatePageRepository]
});
