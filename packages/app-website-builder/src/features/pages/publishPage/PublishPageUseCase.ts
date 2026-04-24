import { PublishPageUseCase as UseCaseAbstraction, PublishPageRepository } from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";

class PublishPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: PublishPageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(Page.create({ id: params.id }));
    }
}

export const PublishPageUseCase = UseCaseAbstraction.createImplementation({
    implementation: PublishPageUseCaseImpl,
    dependencies: [PublishPageRepository]
});
