import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { expectOk } from "./entries.js";

export interface TestContextParams {
    /** Binds the test workflow to the "author" model; `true` by default. */
    withWorkflow?: boolean;
    legacyPlugins?: unknown[];
    /** Makes the "author" model private. */
    privateModel?: boolean;
    identity?: IdentityData;
    permissions?: SecurityPermission[];
}

/** A CMS context with the "author" model, by default bound to the test workflow. */
export const createTestContext = async (params: TestContextParams = {}): Promise<CmsContext> => {
    const { context } = createContextHandler({
        identity: params.identity,
        permissions: params.permissions,
        legacyPlugins: params.legacyPlugins ?? [],
        modifyModel: params.privateModel
            ? model => {
                  return { ...model, isPrivate: true };
              }
            : undefined
    });
    const ctx = await context();
    if (params.withWorkflow !== false) {
        expectOk(await storeWorkflow(ctx));
    }
    return ctx;
};
