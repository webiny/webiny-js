import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

export class InvalidateRedirectsCache {
    private readonly path = "/wb/redirects";

    constructor(private tasks: TaskService.Interface) {}

    async execute(): Promise<void> {
        await this.tasks.trigger({
            definition: "cloudfrontInvalidateCache",
            input: {
                caller: "wb.redirects",
                paths: [this.path]
            }
        });
    }
}
