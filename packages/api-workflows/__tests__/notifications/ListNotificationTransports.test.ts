import { describe, expect, it } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import type { Container } from "@webiny/feature/api";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ListNotificationTransportsUseCase } from "~/features/notifications/ListNotificationTransports/index.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";

const createNotificationsContext = async (
    permissions: SecurityPermission[],
    register?: (container: Container) => void
) => {
    // `NotificationTransport` depends on the mailer, which the test context does not provide.
    const { context } = await createContextHandler({
        permissions,
        setup: container => {
            container.registerInstance(MailerService, {} as MailerService.Interface);
            register?.(container);
        }
    });
    return context.container;
};

describe("ListNotificationTransportsUseCase (internal, D133)", () => {
    it("lists the registered transports without a workflows permission", async () => {
        const container = await createNotificationsContext([]);
        const transports = container.resolveAll(NotificationTransport);

        const result = await container.resolve(ListNotificationTransportsUseCase).execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(
            transports.map(transport => {
                return {
                    id: transport.id,
                    title: transport.title,
                    description: transport.description ?? null
                };
            })
        );
    });

    it("lists the registered transports for a user with reassign only", async () => {
        const container = await createNotificationsContext([{ name: "workflows", reassign: true }]);

        const result = await container.resolve(ListNotificationTransportsUseCase).execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toContainEqual({
            id: "e-mail",
            title: expect.any(String),
            description: "Sends an e-mail to the people who need to act."
        });
    });

    it("lists one row per id, the last registration overriding an earlier one", async () => {
        const container = await createNotificationsContext([], registered => {
            registered.registerInstance(NotificationTransport, {
                id: "custom",
                title: "First",
                send: async () => {}
            });
            registered.registerInstance(NotificationTransport, {
                id: "custom",
                title: "Second",
                send: async () => {}
            });
        });

        const result = await container.resolve(ListNotificationTransportsUseCase).execute();

        expect(result.isOk()).toBe(true);
        const custom = result.value.filter(transport => transport.id === "custom");
        expect(custom).toEqual([{ id: "custom", title: "Second", description: null }]);
    });

    it("lists a transport with a description and one without as null", async () => {
        const container = await createNotificationsContext([], registered => {
            registered.registerInstance(NotificationTransport, {
                id: "described",
                title: "Described",
                description: "Tells the people who need to act.",
                send: async () => {}
            });
            registered.registerInstance(NotificationTransport, {
                id: "plain",
                title: "Plain",
                send: async () => {}
            });
        });

        const result = await container.resolve(ListNotificationTransportsUseCase).execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toContainEqual({
            id: "described",
            title: "Described",
            description: "Tells the people who need to act."
        });
        expect(result.value).toContainEqual({ id: "plain", title: "Plain", description: null });
    });
});
