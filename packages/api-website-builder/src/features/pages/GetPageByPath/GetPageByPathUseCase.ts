import { Result } from "@webiny/feature/api";
import {
    GetPageByPathUseCase as UseCaseAbstraction,
    GetPageByPathRepository
} from "./abstractions.js";
import type { WbPage } from "~/domain/page/abstractions.js";

class GetPageByPathUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetPageByPathRepository.Interface) {}

    async execute(path: string): Promise<Result<WbPage, UseCaseAbstraction.Error>> {
        return this.repository.execute(path);
    }
}

export const GetPageByPathUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageByPathUseCaseImpl,
    dependencies: [GetPageByPathRepository]
});
