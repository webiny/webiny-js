import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { BaseError } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { CdnCache } from "@webiny/api-core/features/cdnCache/index.js";
import { CdnCacheFeature } from "@webiny/api-core/features/cdnCache/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { NullLogger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { CloudFrontCdnCacheFeature } from "~/cdnCache/feature.js";

class TestTaskError extends BaseError {
    override readonly code = "Test/TaskFailed" as const;

    constructor() {
        super({ message: "The task could not be stored." });
    }
}

const PARAMS = { caller: "wb.redirects", paths: ["/wb/redirects"] };

// The order the AWS handler uses: api-core's default first, then the `hostingConfig` hook.
const setup = (trigger: TaskService.Interface["trigger"]) => {
    const logger = new NullLogger();
    const error = vi.spyOn(logger, "error");
    const container = new Container();
    container.registerInstance(Logger, logger);
    container.registerInstance(TaskService, { trigger } as TaskService.Interface);
    CdnCacheFeature.register(container);
    CloudFrontCdnCacheFeature.register(container);
    const cdnCache = container.resolve(CdnCache);
    return { cdnCache, error };
};

describe("TaskCdnCache", () => {
    it("replaces the default and starts the invalidateAssetCache task", async () => {
        const trigger = vi.fn(async () => Result.ok({} as any));
        const { cdnCache, error } = setup(trigger);

        await cdnCache.invalidate(PARAMS);

        expect(trigger).toHaveBeenCalledWith({ definition: "invalidateAssetCache", input: PARAMS });
        expect(error).not.toHaveBeenCalled();
    });

    it("logs a failed result and resolves", async () => {
        const taskError = new TestTaskError();
        const { cdnCache, error } = setup(async () => Result.fail(taskError));

        await cdnCache.invalidate(PARAMS);

        expect(error).toHaveBeenCalledWith(
            { error: taskError, ...PARAMS },
            "Could not invalidate the CDN."
        );
    });

    it("logs a trigger that throws and resolves", async () => {
        const thrown = new Error("Task definition was not found!");
        const { cdnCache, error } = setup(async () => {
            throw thrown;
        });

        await cdnCache.invalidate(PARAMS);

        expect(error).toHaveBeenCalledWith(
            { error: thrown, ...PARAMS },
            "Could not invalidate the CDN."
        );
    });

    it("lets only CloudFront keep a response for a year, since only it is invalidated", () => {
        const trigger = vi.fn(async () => Result.ok({} as any));
        const { cdnCache } = setup(trigger);

        expect(cdnCache.getCacheControl()).toEqual("public, max-age=0, s-maxage=31536000");
    });
});
