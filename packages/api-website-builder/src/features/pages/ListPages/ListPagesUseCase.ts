import { Result } from "@webiny/feature/api";
import {
    ListPagesUseCase as UseCaseAbstraction,
    ListPagesRepository,
    type ListPagesResult
} from "./abstractions.js";
import type { ListPagesParams } from "~/domain/page/abstractions.js";

class ListPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListPagesRepository.Interface) {}

    async execute(
        params: ListPagesParams
    ): Promise<Result<ListPagesResult, UseCaseAbstraction.Error>> {
        return this.repository.execute(params);
    }
}

export const ListPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListPagesUseCaseImpl,
    dependencies: [ListPagesRepository]
});
