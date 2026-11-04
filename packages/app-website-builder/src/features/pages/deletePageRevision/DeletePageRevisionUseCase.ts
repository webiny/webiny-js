import {
    DeletePageRevisionUseCase as UseCaseAbstraction,
    DeletePageRevisionRepository
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";

class DeletePageRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeletePageRevisionRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(Page.create({ id: params.id }));
        return true;
    }
}

export const DeletePageRevisionUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeletePageRevisionUseCaseImpl,
    dependencies: [DeletePageRevisionRepository]
});
