import {
    type UnlockEntryRequestInput,
    UnlockEntryRequestUseCase as UseCaseAbstraction,
    UnlockEntryRequestUseCase
} from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import type { ILockRecord } from "~/domain/index.js";
import { Result } from "@webiny/feature/api/index.js";
import {
    EntryAfterUnlockRequestEvent,
    EntryBeforeUnlockRequestEvent,
    EntryUnlockRequestErrorEvent
} from "./events.js";

class UnlockEntryRequestEventsDecoratorImpl implements UnlockEntryRequestUseCase.Interface {
    constructor(
        private readonly eventPublisher: EventPublisher.Interface,
        private readonly decoratee: UnlockEntryRequestUseCase.Interface
    ) {}

    async execute(
        input: UnlockEntryRequestInput
    ): Promise<Result<ILockRecord, UseCaseAbstraction.Error>> {
        // Publish before event
        await this.eventPublisher.publish(
            new EntryBeforeUnlockRequestEvent({
                id: input.id,
                type: input.type
            })
        );

        const result = await this.decoratee.execute(input);

        if (result.isFail()) {
            const error = result.error;

            await this.eventPublisher.publish(
                new EntryUnlockRequestErrorEvent({
                    id: input.id,
                    type: input.type,
                    error
                })
            );

            return result;
        }

        // Publish after event
        await this.eventPublisher.publish(
            new EntryAfterUnlockRequestEvent({
                id: input.id,
                type: input.type,
                record: result.value
            })
        );

        return result;
    }
}

export const UnlockEntryRequestEventsDecorator = UnlockEntryRequestUseCase.createDecorator({
    decorator: UnlockEntryRequestEventsDecoratorImpl,
    dependencies: [EventPublisher]
});
