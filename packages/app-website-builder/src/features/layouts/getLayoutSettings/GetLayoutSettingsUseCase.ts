import { LayoutsRepository } from "../shared/abstractions.js";
import { GetLayoutSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetLayoutSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute() {
        return this.repository.getSettings();
    }
}

export const GetLayoutSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutSettingsUseCaseImpl,
    dependencies: [LayoutsRepository]
});
