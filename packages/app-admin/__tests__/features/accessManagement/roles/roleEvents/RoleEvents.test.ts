import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import { EventPublisherFeature } from "@webiny/app/features/eventPublisher/index.js";
import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { WebsocketEvent } from "@webiny/app/features/websocketEvents/index.js";
import { RecordChangesFeature } from "@webiny/app/features/recordChanges/index.js";
import { ListCache } from "~/features/listCache/index.js";
import type { Role } from "~/features/accessManagement/types.js";
import { GetRoleGateway } from "~/features/accessManagement/roles/getRole/abstractions.js";
import { RolesListCache } from "~/features/accessManagement/roles/listRoles/abstractions.js";
import { RoleEventsFeature } from "~/features/accessManagement/roles/roleEvents/feature.js";

const role = (overrides: Partial<Role> = {}): Role => ({
    id: "role-1",
    name: "Editor",
    slug: "editor",
    description: "",
    permissions: [],
    plugin: null,
    createdOn: "2026-11-11T00:00:00.000Z",
    ...overrides
});

/*
 * Real publisher, bridge and handler; fake server. The websocket bridge in @webiny/app-websockets
 * publishes `WebsocketEvent`s through the same publisher, so publishing one here is what an incoming
 * message does at runtime.
 */
const setup = (fromServer: Role) => {
    const fetched: string[] = [];
    const container = new Container();
    const cache = new ListCache<Role>();

    container.registerInstance(EnvConfig, {
        get: () => undefined
    } as unknown as EnvConfig.Interface);
    EventPublisherFeature.register(container);
    RecordChangesFeature.register(container);
    container.registerInstance(RolesListCache, cache);
    container.registerInstance(GetRoleGateway, {
        execute: async (id: string) => {
            fetched.push(id);
            return fromServer;
        }
    });
    RoleEventsFeature.register(container);

    const receive = (payload: { action: string; data: unknown }) => {
        const event = new WebsocketEvent(payload);
        return container.resolve(EventPublisher).publish(event);
    };

    return { receive, fetched, cache };
};

describe("role events", () => {
    it("adds a role created on the server to the roles list", async () => {
        const { receive, fetched, cache } = setup(role());

        await receive({
            action: "record.changed",
            data: { type: "security.role", id: "role-1", change: "created" }
        });

        expect(fetched).toEqual(["role-1"]);
        expect(cache.getItems()).toEqual([role()]);
    });

    it("keeps one row when the list already has the role", async () => {
        const fromServer = role({ name: "Editor (server)" });
        const { receive, cache } = setup(fromServer);
        cache.addItems([role()]);

        await receive({
            action: "record.changed",
            data: { type: "security.role", id: "role-1", change: "created" }
        });

        expect(cache.getItems()).toEqual([fromServer]);
    });

    it("replaces an updated role in place, keeping the list order", async () => {
        const fromServer = role({ id: "role-2", name: "Reviewer (renamed)" });
        const { receive, fetched, cache } = setup(fromServer);
        cache.setItems([role(), role({ id: "role-2", name: "Reviewer" }), role({ id: "role-3" })]);

        await receive({
            action: "record.changed",
            data: { type: "security.role", id: "role-2", change: "updated" }
        });

        expect(fetched).toEqual(["role-2"]);
        expect(cache.getItems().map(item => [item.id, item.name])).toEqual([
            ["role-1", "Editor"],
            ["role-2", "Reviewer (renamed)"],
            ["role-3", "Editor"]
        ]);
    });

    it("removes a deleted role without reading it back", async () => {
        const { receive, fetched, cache } = setup(role());
        cache.setItems([role(), role({ id: "role-2" })]);

        await receive({
            action: "record.changed",
            data: { type: "security.role", id: "role-1", change: "deleted" }
        });

        expect(fetched).toEqual([]);
        expect(cache.getItems().map(item => item.id)).toEqual(["role-2"]);
    });

    it("ignores messages that are not about roles", async () => {
        const { receive, fetched, cache } = setup(role());

        await receive({
            action: "record.changed",
            data: { type: "aco.folder", id: "folder-1", change: "created" }
        });

        expect(fetched).toEqual([]);
        expect(cache.getItems()).toEqual([]);
    });
});
