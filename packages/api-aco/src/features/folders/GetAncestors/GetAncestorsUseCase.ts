import { Result } from "@webiny/feature/api";
import {
    GetAncestorsUseCase as UseCaseAbstraction,
    GetAncestorsRepository,
    type GetAncestorsParams
} from "./abstractions.js";
import type { Folder } from "~/folder/folder.types.js";
import { createImplementation } from "@webiny/di";

class GetAncestorsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetAncestorsRepository.Interface) {}

    public async execute(params: GetAncestorsParams): Promise<Result<Folder[], UseCaseAbstraction.Error>> {
        return await this.repository.execute(params);
    }
}

export const GetAncestorsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetAncestorsUseCaseImpl,
    dependencies: [GetAncestorsRepository]
});
