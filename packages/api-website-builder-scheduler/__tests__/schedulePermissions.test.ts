import { describe, expect, it } from "vitest";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreatePageUseCase } from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { CreateRedirectUseCase } from "@webiny/api-website-builder/exports/api/website-builder/redirect.js";
import {
    ScheduleActionUseCase,
    ScheduledActionTypePublish,
    ScheduledActionTypeUnpublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { useHandler } from "./__mocks/context/useHandler.js";
import type { PermissionsArg } from "./__mocks/context/helpers.js";
import { createWebsiteBuilderScheduler } from "~/index.js";
import { createNamespace } from "~/utils/namespace.js";
import { SCHEDULED_ACTION_TYPE_PAGE, SCHEDULED_ACTION_TYPE_REDIRECT } from "~/constants.js";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };

const createContext = async (
    identity: IdentityData,
    permissions?: PermissionsArg[]
): Promise<ApiCoreContext> => {
    const contextHandler = useHandler({
        plugins: [createWebsiteBuilderScheduler()],
        identity,
        permissions
    });
    return contextHandler.handler();
};

const createPage = async (context: ApiCoreContext) => {
    const result = await context.container.resolve(CreatePageUseCase).execute({
        properties: { title: "Page of A" },
        metadata: {},
        bindings: {},
        elements: {},
        location: { folderId: "root" }
    });
    expect(result.isOk()).toBe(true);
    return result.value!;
};

const createRedirect = async (context: ApiCoreContext) => {
    const result = await context.container.resolve(CreateRedirectUseCase).execute({
        redirectFrom: "/old-path",
        redirectTo: "/new-path",
        redirectType: "301",
        isEnabled: false,
        location: { folderId: "root" }
    });
    expect(result.isOk()).toBe(true);
    return result.value!;
};

const schedule = (
    context: ApiCoreContext,
    type: typeof SCHEDULED_ACTION_TYPE_PAGE | typeof SCHEDULED_ACTION_TYPE_REDIRECT,
    targetId: string,
    actionType: typeof ScheduledActionTypePublish | typeof ScheduledActionTypeUnpublish
) => {
    return context.container.resolve(ScheduleActionUseCase).execute({
        tenant: "root",
        namespace: createNamespace(type),
        targetId,
        actionType,
        scheduleFor: new Date(Date.now() + 100000)
    });
};

describe("Website Builder scheduling permissions", () => {
    it.each([
        ["publish a page with read-only access", { rwd: "r" }, ScheduledActionTypePublish],
        [
            "unpublish a page with publish-only access",
            { rwd: "r", pw: "p" },
            ScheduledActionTypeUnpublish
        ]
    ] as const)("should refuse to %s", async (_, pagePermission, actionType) => {
        const page = await createPage(await createContext(identityA));

        const contextB = await createContext(identityB, [{ name: "wb.page", ...pagePermission }]);
        const result = await schedule(contextB, SCHEDULED_ACTION_TYPE_PAGE, page.id, actionType);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });

    it("should allow scheduling a page with publish access", async () => {
        const page = await createPage(await createContext(identityA));

        const contextB = await createContext(identityB, [{ name: "wb.page", rwd: "r", pw: "pu" }]);
        const publish = await schedule(
            contextB,
            SCHEDULED_ACTION_TYPE_PAGE,
            page.id,
            ScheduledActionTypePublish
        );

        expect(publish.isOk()).toBe(true);
    });

    it("should refuse to schedule a redirect with read-only access, and allow with edit access", async () => {
        const redirect = await createRedirect(await createContext(identityA));

        // Redirect access is read-only: the scheduler read check passes, scheduling is refused.
        const readOnly = await createContext(identityB, [{ name: "wb.redirect", rwd: "r" }]);
        const refused = await schedule(
            readOnly,
            SCHEDULED_ACTION_TYPE_REDIRECT,
            redirect.id,
            ScheduledActionTypePublish
        );
        expect(refused.isFail()).toBe(true);
        expect(refused.error.code).toBe("Scheduler/NotAuthorized");

        // Scheduled redirect actions are checked with redirect permissions.
        const editor = await createContext(identityB, [{ name: "wb.redirect", rwd: "rw" }]);
        const allowed = await schedule(
            editor,
            SCHEDULED_ACTION_TYPE_REDIRECT,
            redirect.id,
            ScheduledActionTypePublish
        );
        expect(allowed.isOk()).toBe(true);
    });
});
