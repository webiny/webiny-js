import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import { EventPublisherFeature } from "@webiny/app/features/eventPublisher/index.js";
import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { WebsocketEvent } from "@webiny/app/features/websocketEvents/index.js";
import { ListCache } from "~/features/listCache/index.js";
import type { Team } from "../../types.js";
import { GetTeamGateway } from "../getTeam/abstractions.js";
import { TeamsListCache } from "../listTeams/abstractions.js";
import { TeamEventsFeature } from "./feature.js";

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

        await receive({ action: "security.team.created", data: { id: "team-1" } });

        expect(fetched).toEqual(["team-1"]);
        expect(cache.getItems()).toEqual([team()]);
    });

    it("keeps one row when the list already has the team", async () => {
        const fromServer = team({ name: "Marketing (server)" });
        const { receive, cache } = setup(fromServer);
        cache.addItems([team()]);

        await receive({ action: "security.team.created", data: { id: "team-1" } });

        expect(cache.getItems()).toEqual([fromServer]);
    });

    it("ignores messages that are not about teams", async () => {
        const { receive, fetched, cache } = setup(team());

        await receive({ action: "aco.folder.created", data: { id: "folder-1" } });

        expect(fetched).toEqual([]);
        expect(cache.getItems()).toEqual([]);
    });
});
