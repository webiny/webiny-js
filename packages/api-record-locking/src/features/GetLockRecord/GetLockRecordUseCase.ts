import { Result } from "@webiny/feature/api";
import {
    GetLockRecordUseCase as UseCaseAbstraction,
    GetLockRecordRepository,
    GetLockRecordInput
} from "./abstractions.js";
import type { ILockRecord } from "~/domain/LockRecord.js";

class GetLockRecordUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetLockRecordRepository.Interface) {}

    async execute(
        input: GetLockRecordInput
    ): Promise<Result<ILockRecord, UseCaseAbstraction.Error>> {
        return await this.repository.get(input.id);
    }
}

export const GetLockRecordUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLockRecordUseCaseImpl,
    dependencies: [GetLockRecordRepository]
});
