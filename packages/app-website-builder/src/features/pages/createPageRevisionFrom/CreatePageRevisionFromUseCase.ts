import {
    CreatePageRevisionFromUseCase as UseCaseAbstraction,
    CreatePageRevisionFromRepository
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";

class CreatePageRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreatePageRevisionFromRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        return await this.repository.execute(Page.create({ id: params.id }));
    }
}

export const CreatePageRevisionFromUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreatePageRevisionFromUseCaseImpl,
    dependencies: [CreatePageRevisionFromRepository]
});
