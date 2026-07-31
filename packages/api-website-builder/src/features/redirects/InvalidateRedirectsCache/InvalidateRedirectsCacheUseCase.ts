import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService";
import { InvalidateRedirectsCacheUseCase as UseCaseAbstraction } from "./abstractions.js";

class InvalidateRedirectsCacheUseCaseImpl implements UseCaseAbstraction.Interface {
    private readonly path = "/wb/redirects";

    constructor(private tasks: TaskService.Interface) {}

    async execute(): UseCaseAbstraction.Return {
        const result = await this.tasks.trigger({
            definition: "cloudfrontInvalidateCache",
            input: {
                caller: "wb.redirects",
                paths: [this.path]
            }
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok();
    }
}

export const InvalidateRedirectsCacheUseCase = UseCaseAbstraction.createImplementation({
    implementation: InvalidateRedirectsCacheUseCaseImpl,
    dependencies: [TaskService]
});
