import { Result } from "@webiny/feature/api";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/index.js";

/** The text a failing pool lookup carries; a handler must never log it (R196). */
export const POOL_FAILURE_SECRET = "SECRET-POOL-4711";

/**
 * Answers `listPool` with a fixed list, a failure whose message holds a secret, or a throw, and
 * records how it was called. `listUsers` is not used by the handlers. Register with
 * `container.registerInstance(NotificationRecipientService, stub)`.
 */
export class StubNotificationRecipients implements NotificationRecipientService.Interface {
    public pool: NotificationRecipientService.Recipient[] = [];
    public mode: "ok" | "fail" | "throw" = "ok";
    public readonly poolCalls: NotificationRecipientService.PoolParams[] = [];

    public async listPool(
        params: NotificationRecipientService.PoolParams
    ): NotificationRecipientService.PoolReturn {
        this.poolCalls.push(structuredClone(params));
        if (this.mode === "throw") {
            throw new Error("The recipient service crashed.");
        }
        if (this.mode === "fail") {
            return Result.fail(
                new WorkflowPersistenceError(new Error(`Lookup failed ${POOL_FAILURE_SECRET}.`))
            );
        }
        return Result.ok(this.pool.map(item => ({ ...item })));
    }

    public async listUsers(): NotificationRecipientService.UsersReturn {
        throw new Error("Not used by the handlers.");
    }
}
