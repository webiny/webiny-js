import { z } from "zod";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { UpdateRoleUseCase } from "@webiny/api-core/features/security/roles/UpdateRole/index.js";

const inputSchema = z.object({
    roleId: z.string().describe("Role id as returned by listRoles."),
    name: z.string().min(3).optional().describe("New role name. Omit it to keep the current one."),
    description: z
        .string()
        .max(500)
        .optional()
        .describe("New description. Omit it to keep the current one; an empty string clears it.")
});

type Input = z.infer<typeof inputSchema>;

interface UpdatedRole {
    id: string;
    name: string;
    slug: string;
    description: string;
}

class UpdateRoleToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(private updateRole: UpdateRoleUseCase.Interface) {}

    async execute(input: Input): Promise<UpdatedRole> {
        // A field the model left out arrives as `undefined`; `UpdateRoleUseCase` leaves those alone.
        const result = await this.updateRole.execute(input.roleId, {
            name: input.name,
            description: input.description
        });

        if (result.isFail()) {
            throw new Error(`Could not update the role: ${result.error.message}`);
        }

        const role = result.value;

        return { id: role.id, name: role.name, slug: role.slug, description: role.description };
    }
}

const UpdateRoleToolHandler = AiSdkToolHandler.createImplementation({
    implementation: UpdateRoleToolHandlerImpl,
    dependencies: [UpdateRoleUseCase]
});

/**
 * Renames a role or changes its description. Permissions are out of reach for the same reason as in
 * `createRole`. The slug cannot change because `UpdateRoleUseCase` does not accept one.
 */
class UpdateRoleToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "updateRole";
    readonly title = "Update role";
    readonly description =
        "Changes a role's name or description. Call listRoles first for the id. Permissions cannot be changed with this tool; the user edits them on the Roles screen. Roles defined in code cannot be changed. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, idempotentHint: true };
    readonly handler = UpdateRoleToolHandler;
}

export const UpdateRoleTool = AiSdkToolDefinition.createImplementation({
    implementation: UpdateRoleToolImpl,
    dependencies: []
});
