import { describe, it, expect } from "vitest";
import type { Container } from "@webiny/di";
import { BaseError, Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { useHandler } from "~tests/utils/useHandler";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";
import { DeleteFolderUseCase } from "~/features/folder/DeleteFolder/index.js";

class TriggerFailedError extends BaseError {
    override readonly code = "Test/TriggerFailed" as const;

    constructor() {
        super({ message: "Could not start the step function." });
    }
}

interface LoggedError {
    data: { error: unknown; folderId: string };
    message: string;
}

/**
 * Replaces the task service with one whose trigger fails, either by returning a failed Result (how
 * the real service reports a step function it could not start) or by throwing. Returns what the
 * logger received.
 */
const failTaskTriggers = (container: Container, how: "result" | "throw") => {
    const errors: LoggedError[] = [];

    container.registerInstance(TaskService, {
        trigger: async () => {
            if (how === "throw") {
                throw new Error("Task service is down.");
            }
            return Result.fail(new TriggerFailedError());
        },
        abort: async () => Result.fail(new TriggerFailedError()),
        fetchServiceInfo: async () => Result.ok({})
    } as TaskService.Interface);

    const silent = () => {};
    container.registerInstance(Logger, {
        trace: silent,
        debug: silent,
        info: silent,
        warn: silent,
        fatal: silent,
        log: silent,
        error: (data: LoggedError["data"], message: string) => errors.push({ data, message })
    } as Logger.Interface);

    return errors;
};

const createFolder = async (container: Container, slug: string) => {
    const result = await container
        .resolve(CreateFolderUseCase)
        .execute({ type: "type", title: slug, slug, parentId: null });
    return result.value;
};

/*
 * The folder change is saved before the FLP task is triggered, so a trigger that fails cannot undo
 * it. The FLP records then go stale, and the log is the only place that says why.
 */
describe("FLP task trigger failures", () => {
    const { handler } = useHandler();

    it("should log a create trigger that returns a failed result", async () => {
        const context = await handler();
        const errors = failTaskTriggers(context.container, "result");

        const folder = await createFolder(context.container, "trigger-fail-create");

        expect(folder.id).toBeTruthy();
        expect(errors).toEqual([
            {
                data: { error: expect.any(TriggerFailedError), folderId: folder.id },
                message: "Could not trigger the task that creates the folder's FLP record."
            }
        ]);
    });

    it("should log an update trigger that throws", async () => {
        const context = await handler();
        const folder = await createFolder(context.container, "trigger-fail-update");
        const errors = failTaskTriggers(context.container, "throw");

        const updated = await context.container
            .resolve(UpdateFolderUseCase)
            .execute(folder.id, { title: "Renamed" });

        expect(updated.isOk()).toBe(true);
        expect(errors).toEqual([
            {
                data: { error: expect.any(Error), folderId: folder.id },
                message:
                    "Could not trigger the task that updates the FLP records of the folder and its subtree."
            }
        ]);
    });

    it("should log a delete trigger that returns a failed result", async () => {
        const context = await handler();
        const folder = await createFolder(context.container, "trigger-fail-delete");
        const errors = failTaskTriggers(context.container, "result");

        const deleted = await context.container.resolve(DeleteFolderUseCase).execute(folder.id);

        expect(deleted.isOk()).toBe(true);
        expect(errors).toEqual([
            {
                data: { error: expect.any(TriggerFailedError), folderId: folder.id },
                message: "Could not trigger the task that deletes the folder's FLP record."
            }
        ]);
    });
});
