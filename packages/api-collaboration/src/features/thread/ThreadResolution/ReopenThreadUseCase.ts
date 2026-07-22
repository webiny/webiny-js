import { Result } from "@webiny/feature/api";
import { ReopenThreadUseCase as UseCase } from "./abstractions.js";
import { GetThreadUseCase } from "~/features/thread/GetThread/index.js";
import { UpdateThreadRepository } from "~/features/thread/UpdateThread/index.js";

class ReopenThreadUseCaseImpl implements UseCase.Interface {
    constructor(
        private getThread: GetThreadUseCase.Interface,
        private updateThread: UpdateThreadRepository.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const loaded = await this.getThread.execute(id);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }

        const { thread, anchor } = loaded.value;

        thread.resolved = false;
        thread.resolvedBy = null;
        thread.resolvedOn = null;

        const updateResult = await this.updateThread.execute(thread);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        return Result.ok({ thread: updateResult.value, anchor });
    }
}

export const ReopenThreadUseCase = UseCase.createImplementation({
    implementation: ReopenThreadUseCaseImpl,
    dependencies: [GetThreadUseCase, UpdateThreadRepository]
});
