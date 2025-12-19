import { Result } from "@webiny/feature/api";
import {
    GetPageRevisionsUseCase as UseCaseAbstraction,
    GetPageRevisionsRepository
} from "./abstractions.js";
import type { WbPage } from "~/domain/page/abstractions.js";

class GetPageRevisionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetPageRevisionsRepository.Interface) {}

    async execute(entryId: string): Promise<Result<WbPage[], UseCaseAbstraction.Error>> {
        return this.repository.execute(entryId);
    }
}

export const GetPageRevisionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageRevisionsUseCaseImpl,
    dependencies: [GetPageRevisionsRepository]
});
