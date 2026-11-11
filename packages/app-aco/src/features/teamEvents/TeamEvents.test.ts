import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import {
    EventPublisher,
    EventPublisherFeature
} from "@webiny/app/features/eventPublisher/index.js";
import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { WebsocketEvent } from "@webiny/app-websockets/events/WebsocketEvent.js";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { TeamEventsFeature } from "@webiny/app-admin/features/accessManagement/teams/teamEvents/index.js";
import { GetTeamGateway } from "@webiny/app-admin/features/accessManagement/teams/getTeam/abstractions.js";
import { TeamsListCache } from "@webiny/app-admin/features/accessManagement/teams/listTeams/abstractions.js";
import type { Team } from "@webiny/app-admin/features/accessManagement/types.js";
import { TeamEventsBridgeFeature } from "./feature.js";

const team = (overrides: Partial<Team> = {}) =>
    ({
        id: "team-1",
        name: "Marketing",
        slug: "marketing",
        description: "",
        roles: [],
        createdOn: "2026-11-11T00:00:00.000Z",
        ...overrides
    }) as Team;

/*
 * Real publisher, bridge and handler; fake server. The websocket bridge publishes `WebsocketEvent`s
 * through the same publisher, so publishing one here is what an incoming message does at runtime.
 */
const setup = (fromServer: Team) => {
    const fetched: string[] = [];
    const container = new Container();
    const cache = new ListCache<Team>();

    container.registerInstance(EnvConfig, {
        get: () => undefined
    } as unknown as EnvConfig.Interface);
    EventPublisherFeature.register(container);
    container.registerInstance(TeamsListCache, cache);
    container.registerInstance(GetTeamGateway, {
        execute: async (id: string) => {
            fetched.push(id);
            return fromServer;
        }
    });
    TeamEventsFeature.register(container);
    TeamEventsBridgeFeature.register(container);

    const receive = (payload: { action: string; data: unknown }) =>
        container.resolve(EventPublisher).publish(new WebsocketEvent(payload));

    return { receive, fetched, cache };
};

describe("team events", () => {
    it("adds a team created on the server to the teams list", async () => {
        const { receive, fetched, cache } = setup(team());

        await receive({ action: "security.team.created", data: { id: "team-1" } });

        expect(fetched).toEqual(["team-1"]);
        expect(cache.getItems()).toEqual([team()]);
    });

    it("keeps one row when the list already has the team", async () => {
        const { receive, cache } = setup(team({ name: "Marketing (server)" }));
        cache.addItems([team()]);

        await receive({ action: "security.team.created", data: { id: "team-1" } });

        expect(cache.getItems()).toEqual([team({ name: "Marketing (server)" })]);
    });

    it("ignores messages that are not about teams", async () => {
        const { receive, fetched, cache } = setup(team());

        await receive({ action: "aco.folder.created", data: { id: "folder-1" } });

        expect(fetched).toEqual([]);
        expect(cache.getItems()).toEqual([]);
    });
});
