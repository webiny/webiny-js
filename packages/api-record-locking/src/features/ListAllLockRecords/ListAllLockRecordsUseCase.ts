import { Result } from "@webiny/feature/api";
import {
    ListAllLockRecordsUseCase as UseCaseAbstraction,
    ListAllLockRecordsRepository,
    ListAllLockRecordsInput,
    ListAllLockRecordsOutput
} from "./abstractions.js";

class ListAllLockRecordsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListAllLockRecordsRepository.Interface) {}

    async execute(
        input?: ListAllLockRecordsInput
    ): Promise<Result<ListAllLockRecordsOutput, UseCaseAbstraction.Error>> {
        return await this.repository.execute(input);
    }
}

export const ListAllLockRecordsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAllLockRecordsUseCaseImpl,
    dependencies: [ListAllLockRecordsRepository]
});
