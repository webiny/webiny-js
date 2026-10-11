import { describe, expect, it } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ListNotificationTypesUseCase } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";

const createNotificationsContext = async (permissions: SecurityPermission[]) => {
    // `NotificationTransport` depends on the mailer, which the test context does not provide.
    const { context } = await createContextHandler({
        permissions,
        setup: container => {
            container.registerInstance(MailerService, {} as MailerService.Interface);
        }
    });
    return context.container;
};

describe("ListNotificationTypesUseCase (internal, D133)", () => {
    it("lists the registered transports without a workflows permission", async () => {
        const container = await createNotificationsContext([]);
        const transports = container.resolveAll(NotificationTransport);

        const result = await container.resolve(ListNotificationTypesUseCase).execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(
            transports.map(transport => {
                return { id: transport.id, title: transport.title };
            })
        );
    });

    it("lists the registered transports for a user with reassign only", async () => {
        const container = await createNotificationsContext([{ name: "workflows", reassign: true }]);

        const result = await container.resolve(ListNotificationTypesUseCase).execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toHaveLength(1);
    });
});
