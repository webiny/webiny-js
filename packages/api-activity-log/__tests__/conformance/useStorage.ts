import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { useTestRequest } from "../support/useTestRequest.js";

/**
 * A live `ActivityLogStorage`, and nothing else.
 *
 * The conformance suite is deliberately blind to what is behind the interface — it never mentions
 * the CMS — so this is the only file that knows the private-model implementation needs a running
 * CMS at all. Pointing the suite at a different store means writing a sibling of this file.
 */
export const useStorage = (identity?: IdentityData) => {
    const request = useTestRequest({ identity });

    return {
        identity: request.identity,
        withStorage<T>(
            callback: (storage: ActivityLogStorage.Interface) => Promise<T>
        ): Promise<T> {
            return request.withContainer(container =>
                callback(container.resolve(ActivityLogStorage))
            );
        }
    };
};
