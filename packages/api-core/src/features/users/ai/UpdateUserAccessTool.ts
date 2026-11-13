import { z } from "zod";
import { AiSdkToolDefinition } from "~/features/ai/index.js";
import { AiSdkToolHandler } from "~/features/ai/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import { UpdateUserUseCase } from "~/features/users/UpdateUser/index.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";

const inputSchema = z.object({
    userId: z.string().describe("User id as returned by listUsers."),
    email: z
        .string()
        .describe(
            "The user's current email, exactly as listUsers returned it. The change is refused if it does not match."
        ),
    roles: z
        .array(z.string())
        .optional()
        .describe(
            "The complete list of roles the user should have afterwards. It REPLACES the stored list, so include the roles to keep. Omit it to leave the roles alone. Role ids or slugs from listRoles."
        ),
    teams: z
        .array(z.string())
        .optional()
        .describe(
            "The complete list of teams the user should be in afterwards. It REPLACES the stored list, so include the teams to keep. Omit it to leave the teams alone. Team ids or slugs from listTeams."
        )
});

type Input = z.infer<typeof inputSchema>;

interface UpdatedUserAccess {
    id: string;
    email: string;
    roles: string[];
    teams: string[];
}

interface NamedRecord {
    id: string;
    slug: string;
}

/*
 * A user stores role and team ids, and sign-in loads them by id only. `UpdateUserUseCase` stores
 * whatever it is given, so a slug or a typo would be saved and silently grant nothing. The tool maps
 * each value to an id here and refuses any it cannot find.
 */
const toIds = (kind: string, values: string[], known: NamedRecord[]): string[] => {
    const unknown: string[] = [];

    const ids = values.map(value => {
        const match = known.find(record => record.id === value || record.slug === value);
        if (!match) {
            unknown.push(value);
            return value;
        }
        return match.id;
    });

    if (unknown.length > 0) {
        const names = unknown.map(value => `"${value}"`).join(", ");
        throw new Error(
            `Not a known ${kind} id or slug: ${names}. Nothing was changed. Call list${kind === "role" ? "Roles" : "Teams"} for valid values.`
        );
    }

    return Array.from(new Set(ids));
};

/*
 * The checks run before anything is written:
 *
 * - The email is in the input so the approval shows whose access changes; it is checked against the
 *   stored user, so what the user approved is what is changed.
 * - The signed-in user's own access is refused. One wrong role list would lock them out of the
 *   screens they would need to undo it.
 * - Users from an external identity provider (Okta, Auth0) are refused. `ExternalIdpUserSync`
 *   rewrites their roles and teams from the provider at every sign-in, so a change here would be
 *   reported as done and then undone.
 * - Only roles and teams are written. Name, email and password belong to the identity provider too
 *   (Cognito, self-hosted sign-in), and `UpdateUserUseCase` alone would change the Webiny record
 *   without it. Roles and teams exist only in Webiny, so this is safe with any provider.
 */
class UpdateUserAccessToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUser: GetUserUseCase.Interface,
        private listRoles: ListRolesUseCase.Interface,
        private listTeams: ListTeamsUseCase.Interface,
        private updateUser: UpdateUserUseCase.Interface
    ) {}

    async execute(input: Input): Promise<UpdatedUserAccess> {
        if (input.roles === undefined && input.teams === undefined) {
            throw new Error("Pass roles, teams or both. Nothing was changed.");
        }

        const found = await this.getUser.execute({ id: input.userId });
        if (found.isFail()) {
            throw new Error(
                `User "${input.userId}" not found: ${found.error.message}. Call listUsers for valid ids.`
            );
        }

        const user = found.value;

        if (user.email !== input.email) {
            throw new Error(
                `User "${input.userId}" has the email "${user.email}", not "${input.email}", so nothing was changed. Check the user with listUsers.`
            );
        }

        if (user.id === this.identityContext.getIdentity()?.id) {
            throw new Error(
                "This is the signed-in user. Change your own roles and teams in the Users screen, so a mistake cannot lock you out. Nothing was changed."
            );
        }

        if (user.external) {
            throw new Error(
                `"${user.email}" signs in through an external identity provider, which sets their roles and teams at every sign-in. Change them there. Nothing was changed.`
            );
        }

        const changes: { roles?: string[]; teams?: string[] } = {};

        // An empty list has nothing to look up. Reading the roles or teams anyway would make clearing
        // them need security.role or security.team on top of adminUsers.user.
        if (input.roles?.length === 0) {
            changes.roles = [];
        } else if (input.roles !== undefined) {
            const roles = await this.listRoles.execute();
            if (roles.isFail()) {
                throw new Error(`Could not check the roles: ${roles.error.message}`);
            }
            changes.roles = toIds("role", input.roles, roles.value);
        }

        if (input.teams?.length === 0) {
            changes.teams = [];
        } else if (input.teams !== undefined) {
            const teams = await this.listTeams.execute();
            if (teams.isFail()) {
                throw new Error(`Could not check the teams: ${teams.error.message}`);
            }
            changes.teams = toIds("team", input.teams, teams.value);
        }

        const result = await this.updateUser.execute(user.id, changes);
        if (result.isFail()) {
            throw new Error(`Could not update the user: ${result.error.message}`);
        }

        const updated = result.value;

        return {
            id: updated.id,
            email: updated.email,
            roles: updated.roles ?? [],
            teams: updated.teams ?? []
        };
    }
}

const UpdateUserAccessToolHandler = AiSdkToolHandler.createImplementation({
    implementation: UpdateUserAccessToolHandlerImpl,
    dependencies: [
        IdentityContext,
        GetUserUseCase,
        ListRolesUseCase,
        ListTeamsUseCase,
        UpdateUserUseCase
    ]
});

/**
 * Changes which roles and teams a user has.
 *
 * Needs approval: roles and teams decide what the user can do. Each list replaces the stored one,
 * and the approval shows the whole list, so a role the model left out is visible as missing before
 * anything is written.
 */
class UpdateUserAccessToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "updateUserAccess";
    readonly title = "Update user access";
    readonly description =
        "Changes which roles and teams an admin user has. Call listUsers first for the id and exact email. `roles` and `teams` each replace the user's whole list, so pass everything the user should keep; resolve them with listRoles and listTeams. Cannot change the signed-in user or users from an external identity provider, and cannot change a user's name, email or password. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, idempotentHint: true };
    readonly handler = UpdateUserAccessToolHandler;
}

export const UpdateUserAccessTool = AiSdkToolDefinition.createImplementation({
    implementation: UpdateUserAccessToolImpl,
    dependencies: []
});
