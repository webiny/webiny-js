import { LayoutsRepository } from "../shared/abstractions.js";
import { PublishLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";

class PublishLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(id: string) {
        return this.repository.publish(id);
    }
}

export const PublishLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: PublishLayoutUseCaseImpl,
    dependencies: [LayoutsRepository]
});
