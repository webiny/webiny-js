import { DeletePageUseCase as UseCaseAbstraction, DeletePageRepository } from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";

class DeletePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeletePageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(Page.create({ id: params.id }), params.permanently);
    }
}

export const DeletePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeletePageUseCaseImpl,
    dependencies: [DeletePageRepository]
});
