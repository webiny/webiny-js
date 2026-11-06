import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { BaseError } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { CdnCache } from "@webiny/api-core/features/cdnCache/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskCdnCache } from "~/features/FlushCache/TaskCdnCache.js";
import { CdnCacheTriggerError } from "~/features/FlushCache/CdnCacheTriggerError.js";

class TestTaskError extends BaseError {
    override readonly code = "Test/TaskFailed" as const;

    constructor() {
        super({ message: "The task could not be stored." });
    }
}

const createCdnCache = (trigger: TaskService.Interface["trigger"]) => {
    const container = new Container();
    container.registerInstance(TaskService, { trigger } as TaskService.Interface);
    container.register(TaskCdnCache);
    return container.resolve(CdnCache);
};

const PARAMS = { caller: "wb.redirects", paths: ["/wb/redirects"] };

describe("TaskCdnCache", () => {
    it("starts the invalidateAssetCache task with the caller and paths", async () => {
        const trigger = vi.fn(async () => Result.ok({} as any));
        const cdnCache = createCdnCache(trigger);

        const result = await cdnCache.invalidate(PARAMS);

        expect(result.isOk()).toBe(true);
        expect(trigger).toHaveBeenCalledWith({ definition: "invalidateAssetCache", input: PARAMS });
    });

    it("returns the task service's failure", async () => {
        const error = new TestTaskError();
        const cdnCache = createCdnCache(async () => Result.fail(error));

        const result = await cdnCache.invalidate(PARAMS);

        expect(result.isFail()).toBe(true);
        expect(result.error).toBe(error);
    });

    it("turns a trigger that throws into a failed result", async () => {
        const cdnCache = createCdnCache(async () => {
            throw new Error("Task definition was not found!");
        });

        const result = await cdnCache.invalidate(PARAMS);

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(CdnCacheTriggerError);
        expect(result.error.message).toBe("Task definition was not found!");
    });
});
