import {
    type LockEntryInput,
    LockEntryUseCase as UseCaseAbstraction,
    LockEntryUseCase
} from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import type { ILockRecord } from "~/domain/index.js";
import { Result } from "@webiny/feature/api/index.js";
import { EntryAfterLockEvent, EntryBeforeLockEvent, EntryLockErrorEvent } from "./events.js";

class LockEntryErrorDecoratorImpl implements LockEntryUseCase.Interface {
    constructor(
        private readonly eventPublisher: EventPublisher.Interface,
        private readonly decoratee: LockEntryUseCase.Interface
    ) {}
    async execute(input: LockEntryInput): Promise<Result<ILockRecord, UseCaseAbstraction.Error>> {
        // Publish before event
        await this.eventPublisher.publish(
            new EntryBeforeLockEvent({
                id: input.id,
                type: input.type
            })
        );

        const result = await this.decoratee.execute(input);

        if (result.isFail()) {
            const error = result.error;

            await this.eventPublisher.publish(
                new EntryLockErrorEvent({
                    id: input.id,
                    type: input.type,
                    error
                })
            );

            return result;
        }

        // Publish after event
        await this.eventPublisher.publish(
            new EntryAfterLockEvent({
                id: input.id,
                type: input.type,
                record: result.value
            })
        );

        return result;
    }
}

export const LockEntryEventsDecorator = LockEntryUseCase.createDecorator({
    decorator: LockEntryErrorDecoratorImpl,
    dependencies: [EventPublisher]
});
