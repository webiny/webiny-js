import {
    SCHEDULED_ACTION_EVENT_IDENTIFIER,
    ScheduledActionInputHandler
} from "@webiny/api-kernel-core";
import type { InputChainRunner } from "@webiny/api-kernel-core";
import { InputTenantSource } from "./abstractions.js";

class ScheduledActionTenantSourceImpl implements InputTenantSource.Interface {
    getTenant(request: InputChainRunner.Request): InputTenantSource.Tenant | undefined {
        if (request.abstraction !== ScheduledActionInputHandler) {
            return undefined;
        }
        /*
         * Scheduled actions created before `tenant` was added to the payload carry none; they ran as
         * the request's tenant, which for a scheduler invocation was the root.
         */
        const action = request.input?.[SCHEDULED_ACTION_EVENT_IDENTIFIER];
        return { tenantId: action?.tenant || null };
    }
}

/** A scheduled action runs in the tenant it was scheduled in: `tenant` of its payload. */
export const ScheduledActionTenantSource = InputTenantSource.createImplementation({
    implementation: ScheduledActionTenantSourceImpl,
    dependencies: []
});
