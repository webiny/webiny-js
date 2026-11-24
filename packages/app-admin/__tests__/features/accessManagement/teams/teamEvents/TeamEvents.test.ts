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
import type { Team } from "~/features/accessManagement/types.js";
import { GetTeamGateway } from "~/features/accessManagement/teams/getTeam/abstractions.js";
import { TeamsListCache } from "~/features/accessManagement/teams/listTeams/abstractions.js";
import { TeamEventsFeature } from "~/features/accessManagement/teams/teamEvents/feature.js";

const team = (overrides: Partial<Team> = {}): Team => ({
    id: "team-1",
    name: "Marketing",
    slug: "marketing",
    description: "",
    roles: [],
    plugin: null,
    createdOn: "2026-11-11T00:00:00.000Z",
    ...overrides
});

/*
 * Real publisher, bridge and handler; fake server. The websocket bridge in @webiny/app-websockets
 * publishes `WebsocketEvent`s through the same publisher, so publishing one here is what an incoming
 * message does at runtime.
 */
const setup = (fromServer: Team) => {
    const fetched: string[] = [];
    const container = new Container();
    const cache = new ListCache<Team>();

    container.registerInstance(EnvConfig, {
        get: () => undefined
    } as unknown as EnvConfig.Interface);
    EventPublisherFeature.register(container);
    RecordChangesFeature.register(container);
    container.registerInstance(TeamsListCache, cache);
    container.registerInstance(GetTeamGateway, {
        execute: async (id: string) => {
            fetched.push(id);
            return fromServer;
        }
    });
    TeamEventsFeature.register(container);

    const receive = (payload: { action: string; data: unknown }) => {
        const event = new WebsocketEvent(payload);
        return container.resolve(EventPublisher).publish(event);
    };

    return { receive, fetched, cache };
};

describe("team events", () => {
    it("adds a team created on the server to the teams list", async () => {
        const { receive, fetched, cache } = setup(team());

        await receive({
            action: "record.changed",
            data: { type: "security.team", id: "team-1", change: "created" }
        });

        expect(fetched).toEqual(["team-1"]);
        expect(cache.getItems()).toEqual([team()]);
    });

    it("keeps one row when the list already has the team", async () => {
        const fromServer = team({ name: "Marketing (server)" });
        const { receive, cache } = setup(fromServer);
        cache.addItems([team()]);

        await receive({
            action: "record.changed",
            data: { type: "security.team", id: "team-1", change: "created" }
        });

        expect(cache.getItems()).toEqual([fromServer]);
    });

    it("replaces an updated team in place, keeping the list order", async () => {
        const fromServer = team({ id: "team-2", name: "Sales (renamed)" });
        const { receive, fetched, cache } = setup(fromServer);
        cache.setItems([team(), team({ id: "team-2", name: "Sales" }), team({ id: "team-3" })]);

        await receive({
            action: "record.changed",
            data: { type: "security.team", id: "team-2", change: "updated" }
        });

        expect(fetched).toEqual(["team-2"]);
        expect(cache.getItems().map(item => [item.id, item.name])).toEqual([
            ["team-1", "Marketing"],
            ["team-2", "Sales (renamed)"],
            ["team-3", "Marketing"]
        ]);
    });

    it("removes a deleted team without reading it back", async () => {
        const { receive, fetched, cache } = setup(team());
        cache.setItems([team(), team({ id: "team-2" })]);

        await receive({
            action: "record.changed",
            data: { type: "security.team", id: "team-1", change: "deleted" }
        });

        expect(fetched).toEqual([]);
        expect(cache.getItems().map(item => item.id)).toEqual(["team-2"]);
    });

    it("ignores messages that are not about teams", async () => {
        const { receive, fetched, cache } = setup(team());

        await receive({
            action: "record.changed",
            data: { type: "aco.folder", id: "folder-1", change: "created" }
        });

        expect(fetched).toEqual([]);
        expect(cache.getItems()).toEqual([]);
    });
});
