import { describe, test, expect, beforeEach } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { useGqlHandler } from "../useGqlHandler";
import teamMocks from "../mocks/securityTeam";
import roleMocks from "../mocks/securityRole";
import { WebsocketsSendToIdentityUseCase } from "~/features/websockets/index.js";

interface SentMessage {
    identityId: string;
    action?: string;
    data?: unknown;
}

/*
 * The admin keeps its own teams and roles lists, so every write tells the user's open tabs which
 * record to read back or drop. api-core sends through its own abstraction, so this holds without a
 * websockets package installed, and the write must not fail when nothing implements the send.
 */
describe("team and role change notifications", () => {
    const sent: SentMessage[] = [];

    const recordSends = (container: Container) => {
        container.registerInstance(WebsocketsSendToIdentityUseCase, {
            async execute(identity, data) {
                sent.push({ identityId: identity.id, action: data.action, data: data.data });
                return Result.ok();
            }
        });
    };

    const { install, securityTeam, securityRole } = useGqlHandler({
        wcpLicense: createTestWcpLicense(),
        registrations: [recordSends]
    });

    beforeEach(async () => {
        await install.install();
        sent.length = 0;
    });

    test("should announce a created, updated and deleted team", async () => {
        const [created] = await securityTeam.create({ data: teamMocks.teamA });
        const id = created.data.security.createTeam.data.id;

        await securityTeam.update({ id, data: { name: "Renamed" } });
        await securityTeam.delete({ id });

        expect(sent).toEqual([
            {
                identityId: expect.any(String),
                action: "record.changed",
                data: { type: "security.team", id, change: "created" }
            },
            {
                identityId: expect.any(String),
                action: "record.changed",
                data: { type: "security.team", id, change: "updated" }
            },
            {
                identityId: expect.any(String),
                action: "record.changed",
                data: { type: "security.team", id, change: "deleted" }
            }
        ]);
    });

    test("should announce a created, updated and deleted role", async () => {
        const [created] = await securityRole.create({ data: roleMocks.roleA });
        const id = created.data.security.createRole.data.id;

        await securityRole.update({ id, data: { name: "Renamed" } });
        await securityRole.delete({ id });

        expect(sent).toEqual([
            {
                identityId: expect.any(String),
                action: "record.changed",
                data: { type: "security.role", id, change: "created" }
            },
            {
                identityId: expect.any(String),
                action: "record.changed",
                data: { type: "security.role", id, change: "updated" }
            },
            {
                identityId: expect.any(String),
                action: "record.changed",
                data: { type: "security.role", id, change: "deleted" }
            }
        ]);
    });
});

describe("team and role writes without a websockets package", () => {
    const { install, securityTeam, securityRole } = useGqlHandler({
        wcpLicense: createTestWcpLicense()
    });

    beforeEach(async () => {
        await install.install();
    });

    test("should save a team and a role when nothing implements the send", async () => {
        const [team] = await securityTeam.create({ data: teamMocks.teamA });
        const [role] = await securityRole.create({ data: roleMocks.roleA });

        expect(team.data.security.createTeam.error).toBeNull();
        expect(role.data.security.createRole.error).toBeNull();
    });
});
