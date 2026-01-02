import {
    type UnlockEntryInput,
    UnlockEntryUseCase as UseCaseAbstraction,
    UnlockEntryUseCase
} from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import type { ILockRecord } from "~/domain/index.js";
import { Result } from "@webiny/feature/api/index.js";
import { EntryAfterUnlockEvent, EntryBeforeUnlockEvent, EntryUnlockErrorEvent } from "./events.js";

class UnlockEntryEventsDecoratorImpl implements UnlockEntryUseCase.Interface {
    constructor(
        private readonly eventPublisher: EventPublisher.Interface,
        private readonly decoratee: UnlockEntryUseCase.Interface
    ) {}

    async execute(input: UnlockEntryInput): Promise<Result<ILockRecord, UseCaseAbstraction.Error>> {
        // Publish before event
        await this.eventPublisher.publish(
            new EntryBeforeUnlockEvent({
                id: input.id,
                type: input.type,
                force: input.force
            })
        );

        const result = await this.decoratee.execute(input);

        if (result.isFail()) {
            const error = result.error;

            await this.eventPublisher.publish(
                new EntryUnlockErrorEvent({
                    id: input.id,
                    type: input.type,
                    error
                })
            );

            return result;
        }

        // Publish after event
        await this.eventPublisher.publish(
            new EntryAfterUnlockEvent({
                id: input.id,
                type: input.type,
                record: result.value
            })
        );

        return result;
    }
}

export const UnlockEntryEventsDecorator = UnlockEntryUseCase.createDecorator({
    decorator: UnlockEntryEventsDecoratorImpl,
    dependencies: [EventPublisher]
});
