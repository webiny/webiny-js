import { createPrivateTaskDefinition } from "@webiny/tasks";
import { InvalidateCloudfrontCacheTask } from "./InvalidateCacheTask.js";

export const createInvalidateCacheTask = () => {
    return createPrivateTaskDefinition({
        id: "cloudfrontInvalidateCache",
        title: "Invalidate Cloudfront Cache",
        description: "A task to invalidate Cloudfront cache by given paths.",
        run(params) {
            const taskRunner = new InvalidateCloudfrontCacheTask();
            return taskRunner.run(params);
        }
    });
};
