import { Result } from "@webiny/feature/api";
import { GetPageByIdUseCase as UseCaseAbstraction, GetPageByIdRepository } from "./abstractions.js";
import type { WbPage } from "~/domain/page/abstractions.js";

class GetPageByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetPageByIdRepository.Interface) {}

    async execute(id: string): Promise<Result<WbPage, UseCaseAbstraction.Error>> {
        return this.repository.execute(id);
    }
}

export const GetPageByIdUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageByIdUseCaseImpl,
    dependencies: [GetPageByIdRepository]
});
