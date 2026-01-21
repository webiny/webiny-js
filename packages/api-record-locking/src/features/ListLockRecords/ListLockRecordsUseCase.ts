import { Result } from "@webiny/feature/api";
import {
    ListLockRecordsInput,
    ListLockRecordsOutput,
    ListLockRecordsRepository,
    ListLockRecordsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { RecordLockingConfig } from "~/domain/abstractions.js";

class ListLockRecordsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: ListLockRecordsRepository.Interface,
        private identityContext: IdentityContext.Interface,
        private config: RecordLockingConfig.Interface
    ) {}

    async execute(
        input?: ListLockRecordsInput
    ): Promise<Result<ListLockRecordsOutput, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();

        // Filter out expired locks and exclude current user's locks
        const enhancedInput: ListLockRecordsInput = {
            ...input,
            where: {
                ...input?.where,
                createdBy_not: identity.id,
                savedOn_gte: new Date(new Date().getTime() - this.config.timeout).toISOString()
            }
        };

        return await this.repository.execute(enhancedInput);
    }
}

export const ListLockRecordsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListLockRecordsUseCaseImpl,
    dependencies: [ListLockRecordsRepository, IdentityContext, RecordLockingConfig]
});
