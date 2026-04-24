import {
    UnpublishPageUseCase as UseCaseAbstraction,
    UnpublishPageRepository
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";

class UnpublishPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UnpublishPageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(Page.create({ id: params.id }));
    }
}

export const UnpublishPageUseCase = UseCaseAbstraction.createImplementation({
    implementation: UnpublishPageUseCaseImpl,
    dependencies: [UnpublishPageRepository]
});
