import { createTaskDefinition } from "@webiny/tasks";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { InvalidateCloudfrontCacheTask } from "./InvalidateCacheTask";

export const createInvalidateCacheTask = () => {
    return createTaskDefinition<FileManagerContext>({
        id: "cloudfrontInvalidateCache",
        title: "Invalidate Cloudfront Cache",
        description: "A task to invalidate Cloudfront cache by given paths.",
        run(params) {
            const taskRunner = new InvalidateCloudfrontCacheTask();
            return taskRunner.run(params);
        }
    });
};
