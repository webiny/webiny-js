import { BackgroundTaskInputHandler } from "@webiny/api-kernel-core";
import type { InputChainRunner } from "@webiny/api-kernel-core";
import { InputTenantSource } from "./abstractions.js";

class BackgroundTaskTenantSourceImpl implements InputTenantSource.Interface {
    getTenant(request: InputChainRunner.Request): InputTenantSource.Tenant | undefined {
        if (request.abstraction !== BackgroundTaskInputHandler) {
            return undefined;
        }
        // The SFN/EventBridge transport wraps the task as `{ name, payload }`; in-process it's flat.
        const task = request.input?.payload || request.input;
        return { tenantId: task?.tenant || null };
    }
}

/** A background task runs in the tenant it was started in: `tenant` of its payload. */
export const BackgroundTaskTenantSource = InputTenantSource.createImplementation({
    implementation: BackgroundTaskTenantSourceImpl,
    dependencies: []
});
