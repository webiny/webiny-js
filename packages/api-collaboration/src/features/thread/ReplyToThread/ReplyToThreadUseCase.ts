import { Result } from "@webiny/feature/api";
import { mdbid } from "@webiny/utils";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { ReplyToThreadUseCase as UseCase } from "./abstractions.js";
import { GetThreadUseCase } from "~/features/thread/GetThread/index.js";
import { UpdateThreadRepository } from "~/features/thread/UpdateThread/index.js";
import type { ICollabMessage } from "~/domain/thread/abstractions.js";
import { CollabReplyAddedEvent } from "~/domain/thread/events.js";
import {
    CollabThreadNotAuthorizedError,
    CollabThreadValidationError
} from "~/domain/thread/errors.js";
import { toCollabIdentity } from "~/utils/identity.js";

class ReplyToThreadUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getThread: GetThreadUseCase.Interface,
        private updateThread: UpdateThreadRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(
                new CollabThreadNotAuthorizedError("You must be signed in to reply.")
            );
        }

        if (!input.body || input.body.trim().length === 0) {
            return Result.fail(new CollabThreadValidationError("Reply body cannot be empty."));
        }

        const loaded = await this.getThread.execute(input.threadId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }

        const { thread, anchor } = loaded.value;

        const message: ICollabMessage = {
            id: mdbid(),
            body: input.body,
            mentions: input.mentions ?? [],
            createdBy: toCollabIdentity(identity),
            createdOn: new Date().toISOString()
        };

        thread.messages = [...thread.messages, message];

        const updateResult = await this.updateThread.execute(thread);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        await this.eventPublisher.publish(
            new CollabReplyAddedEvent({ thread: updateResult.value, message, anchor })
        );

        return Result.ok(message);
    }
}

export const ReplyToThreadUseCase = UseCase.createImplementation({
    implementation: ReplyToThreadUseCaseImpl,
    dependencies: [IdentityContext, GetThreadUseCase, UpdateThreadRepository, EventPublisher]
});
