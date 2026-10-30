import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { MailerService } from "@webiny/api-mailer";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";
import { ListNotificationTransportsUseCase } from "~/features/notifications/ListNotificationTransports/index.js";
import { ListWorkflowNotificationTransportsUseCase } from "~/features/config/ListWorkflowNotificationTransports/index.js";

const FIXED_MESSAGE = "A lookup the workflow editor needs failed.";

const expectFixedFailure = (
    result: Awaited<ReturnType<ListWorkflowNotificationTransportsUseCase.Interface["execute"]>>,
    rawText: string
) => {
    expect(result.error.code).toBe("Workflows/Workflow/Lookup");
    expect(result.error.message).toBe(FIXED_MESSAGE);
    expect(
        JSON.stringify({ message: result.error.message, data: result.error.data })
    ).not.toContain(rawText);
    // The cause travels on the error and the resolver logs it once; the use case logs nothing.
    expect(hasErrorSource(result.error) && result.error.source.message).toBe(rawText);
    expect(loggedErrors).toEqual([]);
};

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

const registerTransport = (
    container: Container,
    id: string,
    title: string,
    description?: string
) => {
    container.registerInstance(NotificationTransport, {
        id,
        title,
        description,
        send: async () => {}
    });
};

const createListContext = async (params: CmsTestHandlerParams = {}) => {
    loggedErrors.length = 0;
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            // The built-in e-mail transport depends on the mailer, which the test context lacks.
            container.registerInstance(MailerService, {} as MailerService.Interface);
            await params.setup?.(container);
        }
    });
    return {
        container: context.container,
        listTransports: context.container.resolve(ListWorkflowNotificationTransportsUseCase)
    };
};

describe("ListWorkflowNotificationTransportsUseCase (R191, D133)", () => {
    it("lists the built-in e-mail transport for an editor", async () => {
        const { listTransports } = await createListContext({
            permissions: [{ name: "workflows", editor: true }]
        });

        const rows = expectOk(await listTransports.execute());

        expect(rows).toEqual([
            {
                id: "e-mail",
                title: "E-mail",
                description: "Sends an e-mail to the people who need to act."
            }
        ]);
    });

    it("lists id, title and description only, with a missing description as null", async () => {
        const { listTransports } = await createListContext({
            permissions: [{ name: "workflows", editor: true }],
            setup: container => {
                registerTransport(container, "plain", "Plain");
                registerTransport(container, "described", "Described", "Tells the team.");
            }
        });

        const rows = expectOk(await listTransports.execute());

        expect(rows).toContainEqual({ id: "plain", title: "Plain", description: null });
        expect(rows).toContainEqual({
            id: "described",
            title: "Described",
            description: "Tells the team."
        });
        for (const row of rows) {
            expect(Object.keys(row)).toEqual(["id", "title", "description"]);
        }
    });

    it("sorts the rows by title, then by id", async () => {
        const { listTransports } = await createListContext({
            setup: container => {
                registerTransport(container, "zulu", "Zulu");
                registerTransport(container, "alphaTwo", "Alpha");
                registerTransport(container, "mike", "Mike");
                registerTransport(container, "alphaOne", "Alpha");
            }
        });

        const rows = expectOk(await listTransports.execute());

        expect(rows.map(row => row.id)).toEqual(["alphaOne", "alphaTwo", "e-mail", "mike", "zulu"]);
    });

    it("allows a full-access permission set", async () => {
        const { listTransports } = await createListContext({
            permissions: [{ name: "workflows.*" }]
        });

        expect((await listTransports.execute()).isOk()).toBe(true);
    });

    it("refuses a user without editor", async () => {
        const { listTransports } = await createListContext({
            permissions: [{ name: "workflows", reassign: true }]
        });

        const result = await listTransports.execute();

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.message).toBe("You are not allowed to list notification transports.");
        expect(result.error.data).toEqual({ action: "list notification transports" });
    });

    it("refuses an anonymous identity", async () => {
        const { container, listTransports } = await createListContext();

        const result = await container
            .resolve(IdentityContext)
            .withIdentity(new AnonymousIdentity(), () => listTransports.execute());

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("returns the workflow persistence error when the permission check throws, logged once (R87)", async () => {
        const { listTransports } = await createListContext({
            setup: container => {
                captureLoggedErrors(container);
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listTransports.execute();

        expectFixedFailure(result, "Permissions are down.");
    });

    it("returns the workflow persistence error when the engine list throws, logged once (R87)", async () => {
        const { listTransports } = await createListContext({
            setup: container => {
                captureLoggedErrors(container);
                container.registerInstance(ListNotificationTransportsUseCase, {
                    execute: async () => {
                        throw new Error("The transport list is down.");
                    }
                });
            }
        });

        const result = await listTransports.execute();

        expectFixedFailure(result, "The transport list is down.");
    });

    it("returns the workflow persistence error when the engine list fails, logged once (R87)", async () => {
        const { listTransports } = await createListContext({
            setup: container => {
                captureLoggedErrors(container);
                container.registerInstance(ListNotificationTransportsUseCase, {
                    execute: async () => {
                        return Result.fail(new Error("The transport list failed.") as never);
                    }
                });
            }
        });

        const result = await listTransports.execute();

        expectFixedFailure(result, "The transport list failed.");
    });
});
