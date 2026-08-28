import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ResolveThreadUseCase as UseCase } from "./abstractions.js";
import { GetThreadUseCase } from "~/features/thread/GetThread/index.js";
import { UpdateThreadRepository } from "~/features/thread/UpdateThread/index.js";
import { toCollabIdentity } from "~/utils/identity.js";

class ResolveThreadUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getThread: GetThreadUseCase.Interface,
        private updateThread: UpdateThreadRepository.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const loaded = await this.getThread.execute(id);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }

        const { thread, anchor } = loaded.value;

        thread.resolved = true;
        thread.resolvedBy = toCollabIdentity(this.identityContext.getIdentity());
        thread.resolvedOn = new Date().toISOString();

        const updateResult = await this.updateThread.execute(thread);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        return Result.ok({ thread: updateResult.value, anchor });
    }
}

export const ResolveThreadUseCase = UseCase.createImplementation({
    implementation: ResolveThreadUseCaseImpl,
    dependencies: [IdentityContext, GetThreadUseCase, UpdateThreadRepository]
});
