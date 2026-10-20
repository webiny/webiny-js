import { describe, expect, it, vi } from "vitest";
import { Container, Result } from "@webiny/feature/api";
import {
    CancelScheduledActionUseCase,
    ListScheduledActionsUseCase
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { EntryAfterPublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { CancelScheduledActionOnPublishEventHandler } from "~/features/CancelScheduledActionOnEntryChange/CancelScheduledActionOnPublishEventHandler.js";

/*
 * Publishing an entry must not fail because the scheduled actions couldn't be listed.
 * The handler logs the error and leaves the scheduled actions alone.
 */
describe("CancelScheduledActionOnPublishEventHandler", () => {
    it("logs and returns when listing scheduled actions fails", async () => {
        const error = new Error("Could not list.");
        const logger = { error: vi.fn() };
        const cancel = { execute: vi.fn() };

        const container = new Container();
        container.registerInstance(ListScheduledActionsUseCase, {
            execute: async () => Result.fail(error)
        } as unknown as ListScheduledActionsUseCase.Interface);
        container.registerInstance(
            CancelScheduledActionUseCase,
            cancel as unknown as CancelScheduledActionUseCase.Interface
        );
        container.registerInstance(Logger, logger as unknown as Logger.Interface);
        container.register(CancelScheduledActionOnPublishEventHandler);

        const [handler] = container.resolveAll(EntryAfterPublishEventHandler);

        await expect(
            handler.handle({
                payload: {
                    entry: { id: "entry-1#0001" },
                    model: { modelId: "article", isPrivate: false }
                }
            } as unknown as EntryAfterPublishEventHandler.Event)
        ).resolves.toBeUndefined();

        expect(logger.error).toHaveBeenCalledWith({ error }, expect.any(String));
        expect(cancel.execute).not.toHaveBeenCalled();
    });
});
