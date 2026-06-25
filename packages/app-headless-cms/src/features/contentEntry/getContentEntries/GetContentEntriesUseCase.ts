import {
    GetContentEntriesUseCase as UseCaseAbstraction,
    GetContentEntriesGateway
} from "./abstractions.js";
import type { IGetContentEntriesUseCaseParams } from "./abstractions.js";

class GetContentEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: GetContentEntriesGateway.Interface) {}

    async execute(params: IGetContentEntriesUseCaseParams) {
        return this.gateway.execute(params);
    }
}

export const GetContentEntriesUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetContentEntriesUseCaseImpl,
    dependencies: [GetContentEntriesGateway]
});
