import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { CreateRoleUseCase } from "@webiny/api-core/features/security/roles/CreateRole/index.js";
import { GetRoleUseCase } from "@webiny/api-core/features/security/roles/GetRole/index.js";
import { UpdateRoleUseCase } from "@webiny/api-core/features/security/roles/UpdateRole/index.js";
import { DeleteRoleUseCase } from "@webiny/api-core/features/security/roles/DeleteRole/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { CreateRoleTool } from "~/features/ai/CreateRoleTool.js";
import { UpdateRoleTool } from "~/features/ai/UpdateRoleTool.js";
import { DeleteRoleTool } from "~/features/ai/DeleteRoleTool.js";

const editor = {
    id: "role-1",
    name: "Editor",
    slug: "editor",
    description: "",
    system: false,
    permissions: [{ name: "cms.*" }]
};

const resolveHandler = (container: Container) => {
    const tool = container.resolveAll(AiSdkToolDefinition)[0];
    return container.resolveImplementation(tool.handler);
};

describe("createRole tool", () => {
    const setup = () => {
        const sent: { permissions?: unknown[] } = {};
        const container = new Container();

        container.registerInstance(GetRoleUseCase, {
            execute: async ({ id }: { id: string }) =>
                id === editor.id ? Result.ok(editor) : Result.fail(new Error("Not found"))
        } as unknown as GetRoleUseCase.Interface);
        container.registerInstance(CreateRoleUseCase, {
            execute: async (input: { name: string; slug: string; permissions: unknown[] }) => {
                sent.permissions = input.permissions;
                return Result.ok({ id: "role-2", ...input });
            }
        } as unknown as CreateRoleUseCase.Interface);
        container.register(CreateRoleTool);

        return { handler: resolveHandler(container), sent };
    };

    it("creates a role with no permissions by default", async () => {
        const { handler, sent } = setup();

        const result = await handler.execute({ name: "Reviewer", slug: "reviewer" });

        expect(sent.permissions).toEqual([]);
        expect(result).toEqual({ id: "role-2", name: "Reviewer", slug: "reviewer" });
    });

    it("copies the permissions of the named role", async () => {
        const { handler, sent } = setup();

        const result = await handler.execute({
            name: "Reviewer",
            slug: "reviewer",
            copyPermissionsFrom: "role-1"
        });

        expect(sent.permissions).toEqual([{ name: "cms.*" }]);
        expect(result).toMatchObject({ permissionsCopiedFrom: "Editor" });
    });

    it("refuses an unknown source role and creates nothing", async () => {
        const { handler, sent } = setup();

        await expect(
            handler.execute({ name: "Reviewer", slug: "reviewer", copyPermissionsFrom: "nope" })
        ).rejects.toThrow('Role "nope" not found');
        expect(sent.permissions).toBeUndefined();
    });
});

describe("updateRole tool", () => {
    /*
     * `UpdateRoleUseCase` spreads its input onto the stored role, so a key sent as `undefined` would
     * wipe the stored value. Only the keys the model gave may reach it.
     */
    it("passes only the fields the model gave", async () => {
        const sent: { id?: string; input?: Record<string, unknown> } = {};
        const container = new Container();

        container.registerInstance(UpdateRoleUseCase, {
            execute: async (id: string, input: Record<string, unknown>) => {
                sent.id = id;
                sent.input = input;
                return Result.ok({ ...editor, ...input });
            }
        } as unknown as UpdateRoleUseCase.Interface);
        container.register(UpdateRoleTool);

        await resolveHandler(container).execute({
            roleId: "role-1",
            name: "Senior editor",
            description: undefined
        });

        expect(sent.id).toEqual("role-1");
        expect(Object.keys(sent.input!)).toEqual(["name"]);
    });
});

describe("deleteRole tool", () => {
    const setup = (
        options: {
            role?: Partial<typeof editor>;
            teams?: { name: string; roles: string[] }[];
            users?: { displayName: string; email: string; roles?: string[] }[];
        } = {}
    ) => {
        const deleted: string[] = [];
        const container = new Container();

        container.registerInstance(GetRoleUseCase, {
            execute: async () => Result.ok({ ...editor, ...options.role })
        } as unknown as GetRoleUseCase.Interface);
        container.registerInstance(ListTeamsUseCase, {
            execute: async () => Result.ok(options.teams ?? [])
        } as unknown as ListTeamsUseCase.Interface);
        container.registerInstance(ListUsersUseCase, {
            execute: async () => Result.ok(options.users ?? [])
        } as unknown as ListUsersUseCase.Interface);
        container.registerInstance(DeleteRoleUseCase, {
            execute: async (id: string) => {
                deleted.push(id);
                return Result.ok();
            }
        } as unknown as DeleteRoleUseCase.Interface);
        container.register(DeleteRoleTool);

        return { handler: resolveHandler(container), deleted };
    };

    it("deletes a role nothing uses when the name matches", async () => {
        const { handler, deleted } = setup({
            teams: [{ name: "Others", roles: ["role-9"] }]
        });

        const result = await handler.execute({ roleId: "role-1", name: "Editor" });

        expect(deleted).toEqual(["role-1"]);
        expect(result).toEqual({ id: "role-1", name: "Editor", slug: "editor" });
    });

    it("refuses when the name does not match the stored role", async () => {
        const { handler, deleted } = setup();

        await expect(handler.execute({ roleId: "role-1", name: "Admin" })).rejects.toThrow(
            'is named "Editor", not "Admin"'
        );
        expect(deleted).toEqual([]);
    });

    it("refuses a system role", async () => {
        const { handler, deleted } = setup({ role: { name: "Full access", system: true } });

        await expect(handler.execute({ roleId: "role-1", name: "Full access" })).rejects.toThrow(
            "is a system role"
        );
        expect(deleted).toEqual([]);
    });

    it("refuses a role a team or user still has, naming them", async () => {
        const { handler, deleted } = setup({
            teams: [{ name: "Marketing", roles: ["role-1"] }],
            // Matched by slug as well as id.
            users: [{ displayName: "Ada", email: "ada@example.com", roles: ["editor"] }]
        });

        await expect(handler.execute({ roleId: "role-1", name: "Editor" })).rejects.toThrow(
            'is still given to team "Marketing", user "Ada"'
        );
        expect(deleted).toEqual([]);
    });
});
