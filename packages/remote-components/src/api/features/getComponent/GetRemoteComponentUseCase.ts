import {
    GetRemoteComponentUseCase as UseCaseAbstraction,
    GetRemoteComponentRepository
} from "./abstractions.js";

class GetRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetRemoteComponentRepository.Interface) {}

    async execute(id: string) {
        return this.repository.execute(id);
    }
}

export const GetRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetRemoteComponentUseCaseImpl,
    dependencies: [GetRemoteComponentRepository]
});
