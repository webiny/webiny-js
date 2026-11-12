import { z } from "zod";
import { AiSdkToolDefinition } from "~/features/ai/index.js";
import { AiSdkToolHandler } from "~/features/ai/index.js";
import { GetRoleUseCase } from "~/features/security/roles/GetRole/index.js";
import { DeleteRoleUseCase } from "~/features/security/roles/DeleteRole/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";
import { ListUsersUseCase } from "~/features/users/ListUsers/index.js";

const inputSchema = z.object({
    roleId: z.string().describe("Role id as returned by listRoles."),
    name: z
        .string()
        .describe(
            "The role's current name, exactly as listRoles returned it. The delete is refused if it does not match."
        )
});

type Input = z.infer<typeof inputSchema>;

interface DeletedRole {
    id: string;
    name: string;
    slug: string;
}

/*
 * The checks run before anything is deleted, in this order:
 *
 * - The name is in the input so the approval shows which role goes; it is checked against the
 *   stored role, so what the user approved by name is what is removed.
 * - System roles (the Full Access role the installer creates) are refused. `DeleteRoleUseCase`
 *   cannot refuse them itself: `RolesInstaller.uninstall()` uses it to roll back that same role.
 * - A role still given to a team or a user is refused, with their names. `DeleteRoleUseCase` would
 *   delete it and leave them holding the id of a role that no longer exists. Both the id and the
 *   slug are matched, since a record written before roles were resolved to ids can hold the slug.
 *   The check goes through the list use cases, so it needs the caller's permission to list teams
 *   and users. Without it the delete is refused and the error says why.
 */
class DeleteRoleToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getRole: GetRoleUseCase.Interface,
        private listTeams: ListTeamsUseCase.Interface,
        private listUsers: ListUsersUseCase.Interface,
        private deleteRole: DeleteRoleUseCase.Interface
    ) {}

    async execute(input: Input): Promise<DeletedRole> {
        const found = await this.getRole.execute({ id: input.roleId });

        if (found.isFail()) {
            throw new Error(
                `Role "${input.roleId}" not found: ${found.error.message}. Call listRoles for valid ids.`
            );
        }

        const role = found.value;

        if (role.name !== input.name) {
            throw new Error(
                `Role "${input.roleId}" is named "${role.name}", not "${input.name}", so nothing was deleted. Check the role with listRoles.`
            );
        }

        if (role.system) {
            throw new Error(`"${role.name}" is a system role and cannot be deleted.`);
        }

        const holders = await this.findHolders([role.id, role.slug]);

        if (holders.length > 0) {
            throw new Error(
                `"${role.name}" is still given to ${holders.join(", ")}, so nothing was deleted. Remove it from them first.`
            );
        }

        const result = await this.deleteRole.execute(role.id);

        if (result.isFail()) {
            throw new Error(`Could not delete the role: ${result.error.message}`);
        }

        return { id: role.id, name: role.name, slug: role.slug };
    }

    private async findHolders(identifiers: string[]): Promise<string[]> {
        const holds = (roles: string[] | undefined) =>
            (roles ?? []).some(role => identifiers.includes(role));

        const teams = await this.listTeams.execute();
        if (teams.isFail()) {
            throw new Error(
                `Could not check which teams still have the role, so nothing was deleted. Deleting a role here also needs permission to list teams: ${teams.error.message}`
            );
        }

        const users = await this.listUsers.execute();
        if (users.isFail()) {
            throw new Error(
                `Could not check which users still have the role, so nothing was deleted. Deleting a role here also needs permission to list users: ${users.error.message}`
            );
        }

        return [
            ...teams.value.filter(team => holds(team.roles)).map(team => `team "${team.name}"`),
            ...users.value
                .filter(user => holds(user.roles))
                .map(user => `user "${user.displayName || user.email}"`)
        ];
    }
}

const DeleteRoleToolHandler = AiSdkToolHandler.createImplementation({
    implementation: DeleteRoleToolHandlerImpl,
    dependencies: [GetRoleUseCase, ListTeamsUseCase, ListUsersUseCase, DeleteRoleUseCase]
});

/**
 * Deletes one role that nothing uses.
 *
 * Destructive, so the approval says it cannot be undone. Refuses system roles, roles defined in
 * code, and roles still given to a team or a user.
 */
class DeleteRoleToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "deleteRole";
    readonly title = "Delete role";
    readonly description =
        "Deletes one role. Refused for system roles, roles defined in code, and roles still given to a team or user (the error names them). Call listRoles first for the id and exact name. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, destructiveHint: true };
    readonly handler = DeleteRoleToolHandler;
}

export const DeleteRoleTool = AiSdkToolDefinition.createImplementation({
    implementation: DeleteRoleToolImpl,
    dependencies: []
});
