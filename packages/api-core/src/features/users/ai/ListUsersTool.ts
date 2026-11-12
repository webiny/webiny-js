import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "~/features/ai/index.js";
import { ListUsersUseCase } from "~/features/users/ListUsers/index.js";

const inputSchema = z.object({});

interface UserSummary {
    id: string;
    displayName: string;
    email: string;
    /** Role ids, so `updateUserAccess` can be given the full list with one role added or removed. */
    roles: string[];
    /** Team ids, for the same reason. */
    teams: string[];
}

class ListUsersToolHandlerImpl implements AiSdkToolHandler.Interface<Record<string, never>> {
    constructor(private listUsers: ListUsersUseCase.Interface) {}

    async execute(): Promise<UserSummary[]> {
        const result = await this.listUsers.execute();

        if (result.isFail()) {
            throw new Error(`Could not list users: ${result.error.message}`);
        }

        return result.value.map(user => ({
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            roles: user.roles ?? [],
            teams: user.teams ?? []
        }));
    }
}

const ListUsersToolHandler = AiSdkToolHandler.createImplementation({
    implementation: ListUsersToolHandlerImpl,
    dependencies: [ListUsersUseCase]
});

/**
 * Resolves a person ("Jane", "jane@acme.com") to the user id `updateUserAccess` takes, and shows
 * what access they have now.
 */
class ListUsersToolImpl implements AiSdkToolDefinition.Interface<Record<string, never>> {
    readonly name = "listUsers";
    readonly title = "List users";
    readonly description =
        "Lists the admin users in this project with their ids, display names, emails, role ids and team ids. updateUserAccess takes the id and the exact email. Folder permission targets for a user are 'admin:<id>'.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: true, idempotentHint: true };
    readonly handler = ListUsersToolHandler;
}

export const ListUsersTool = AiSdkToolDefinition.createImplementation({
    implementation: ListUsersToolImpl,
    dependencies: []
});
