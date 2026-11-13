import { createImplementation } from "@webiny/di";
import { NotifyRecordChangeUseCase } from "@webiny/api-core/features/websockets/index.js";
import { NotifyEntryChangeUseCase as UseCaseAbstraction } from "./abstractions.js";
import { getEntryRecordType } from "./recordType.js";

/*
 * Called explicitly (today by the assistant's entry tools), not from the entry lifecycle events the
 * way team, role and user changes are announced. Entries are written in bulk (imports, bulk actions, scheduled publishing), and a
 * message per write would mean a websocket send per entry and an admin read-back per message.
 *
 * `NotifyRecordChangeUseCase` swallows a failed send, so the tool does not fail over it.
 */
class NotifyEntryChangeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async execute({ modelId, entryId, change }: UseCaseAbstraction.Params): Promise<void> {
        await this.notifyRecordChange.execute({
            type: getEntryRecordType(modelId),
            id: entryId,
            change
        });
    }
}

export const NotifyEntryChangeUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: NotifyEntryChangeUseCaseImpl,
    dependencies: [NotifyRecordChangeUseCase]
});
