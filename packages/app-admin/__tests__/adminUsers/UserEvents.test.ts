import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import {
    EventPublisher,
    EventPublisherFeature
} from "@webiny/app/features/eventPublisher/index.js";
import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { WebsocketEvent } from "@webiny/app/features/websocketEvents/index.js";
import { UserEventsFeature } from "~/features/adminUsers/users/userEvents/index.js";
import { UsersRevision } from "~/features/adminUsers/users/userEvents/abstractions.js";

/*
 * Real publisher and handlers. The websocket bridge publishes `WebsocketEvent`s through the same
 * publisher, so publishing one here is what an incoming message does at runtime.
 */
const setup = () => {
    const container = new Container();

    // The publisher reads `debug` from here to decide whether to log.
    container.registerInstance(EnvConfig, {
        get: () => undefined
    } as unknown as EnvConfig.Interface);
    EventPublisherFeature.register(container);
    UserEventsFeature.register(container);

    const receive = (payload: { action: string; data: unknown }) =>
        container.resolve(EventPublisher).publish(new WebsocketEvent(payload));

    return { receive, revision: container.resolve(UsersRevision) };
};

describe("user events", () => {
    it("marks the list changed when a user is created or deleted, and leaves the user alone", async () => {
        const { receive, revision } = setup();

        await receive({ action: "adminUsers.user.created", data: { id: "user-1" } });
        await receive({ action: "adminUsers.user.deleted", data: { id: "user-2" } });

        expect(revision.list).toBe(2);
        expect(revision.user("user-1")).toBe(0);
        expect(revision.user("user-2")).toBe(0);
    });

    it("marks the list and that one user changed when a user is updated", async () => {
        const { receive, revision } = setup();

        await receive({ action: "adminUsers.user.updated", data: { id: "user-1" } });

        expect(revision.list).toBe(1);
        expect(revision.user("user-1")).toBe(1);
        expect(revision.user("user-2")).toBe(0);
    });

    it("ignores messages that are not about admin users", async () => {
        const { receive, revision } = setup();

        await receive({ action: "security.team.updated", data: { id: "team-1" } });

        expect(revision.list).toBe(0);
    });
});
