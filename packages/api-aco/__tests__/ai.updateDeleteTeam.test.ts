import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { definedOnly } from "@webiny/api-core/features/security/shared/index.js";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { GetTeamUseCase } from "@webiny/api-core/features/security/teams/GetTeam/index.js";
import { UpdateTeam } from "@webiny/api-core/features/security/teams/UpdateTeam/index.js";
import { DeleteTeam } from "@webiny/api-core/features/security/teams/DeleteTeam/index.js";
import { UpdateTeamTool } from "~/features/ai/UpdateTeamTool.js";
import { DeleteTeamTool } from "~/features/ai/DeleteTeamTool.js";

const stored = {
    id: "team-1",
    name: "Marketing",
    slug: "marketing",
    description: "Writes the blog",
    roles: ["role-a", "role-b"]
};

const resolveHandler = (container: Container) => {
    const tool = container.resolveAll(AiSdkToolDefinition)[0];
    return container.resolveImplementation(tool.handler);
};

describe("updateTeam tool", () => {
    const setup = () => {
        const sent: { id?: string; input?: Record<string, unknown> } = {};
        const container = new Container();

        container.registerInstance(UpdateTeam, {
            execute: async (id: string, input: Record<string, unknown>) => {
                sent.id = id;
                sent.input = input;
                return Result.ok({ ...stored, ...definedOnly(input) });
            }
        } as unknown as UpdateTeam.Interface);
        container.register(UpdateTeamTool);

        return { handler: resolveHandler(container), sent };
    };

    it("passes the role list as given, replacing the stored one", async () => {
        const { handler, sent } = setup();

        const result = await handler.execute({ teamId: "team-1", roles: ["role-a"] });

        expect(sent.input!.roles).toEqual(["role-a"]);
        expect(result).toMatchObject({ id: "team-1", name: "Marketing", roles: ["role-a"] });
    });
});

describe("deleteTeam tool", () => {
    const setup = () => {
        const deleted: string[] = [];
        const container = new Container();

        container.registerInstance(GetTeamUseCase, {
            execute: async () => Result.ok(stored)
        } as unknown as GetTeamUseCase.Interface);
        container.registerInstance(DeleteTeam, {
            execute: async (id: string) => {
                deleted.push(id);
                return Result.ok();
            }
        } as unknown as DeleteTeam.Interface);
        container.register(DeleteTeamTool);

        return { handler: resolveHandler(container), deleted };
    };

    it("deletes the team when the name matches", async () => {
        const { handler, deleted } = setup();

        const result = await handler.execute({ teamId: "team-1", name: "Marketing" });

        expect(deleted).toEqual(["team-1"]);
        expect(result).toEqual({ id: "team-1", name: "Marketing", slug: "marketing" });
    });

    it("refuses when the name does not match the stored team", async () => {
        const { handler, deleted } = setup();

        await expect(handler.execute({ teamId: "team-1", name: "Sales" })).rejects.toThrow(
            'is named "Marketing", not "Sales"'
        );
        expect(deleted).toEqual([]);
    });
});
