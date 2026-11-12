import { z } from "zod";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { CreateRoleUseCase } from "@webiny/api-core/features/security/roles/CreateRole/index.js";
import { GetRoleUseCase } from "@webiny/api-core/features/security/roles/GetRole/index.js";
import { descriptionOnCreate } from "@webiny/api-core/features/security/shared/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

const inputSchema = z.object({
    name: z.string().min(3).describe("Human-readable role name, e.g. 'Blog editor'."),
    slug: z
        .string()
        .min(3)
        .describe("URL-safe identifier, e.g. 'blog-editor'. Lowercase, hyphens instead of spaces."),
    description: z
        .string()
        .max(500)
        .optional()
        .describe("What the role is for. Shown in the admin UI. Omit it if the user did not say."),
    copyPermissionsFrom: z
        .string()
        .optional()
        .describe(
            "Id of an existing role, from listRoles, whose permissions the new role starts with. Omit it to create the role with no permissions."
        )
});

type Input = z.infer<typeof inputSchema>;

interface CreatedRole {
    id: string;
    name: string;
    slug: string;
    /** The role the permissions were copied from, so the reply can say where they came from. */
    permissionsCopiedFrom?: string;
}

class CreateRoleToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getRole: GetRoleUseCase.Interface,
        private createRole: CreateRoleUseCase.Interface
    ) {}

    async execute(input: Input): Promise<CreatedRole> {
        let permissions: SecurityPermission[] = [];
        let source: string | undefined;

        if (input.copyPermissionsFrom) {
            const found = await this.getRole.execute({ id: input.copyPermissionsFrom });

            if (found.isFail()) {
                throw new Error(
                    `Role "${input.copyPermissionsFrom}" not found: ${found.error.message}. Call listRoles for valid ids.`
                );
            }

            permissions = found.value.permissions;
            source = found.value.name;
        }

        const description = descriptionOnCreate(input.description);
        const result = await this.createRole.execute({
            name: input.name,
            slug: input.slug,
            description,
            permissions
        });

        if (result.isFail()) {
            throw new Error(`Could not create the role: ${result.error.message}`);
        }

        const role = result.value;
        const created: CreatedRole = { id: role.id, name: role.name, slug: role.slug };

        if (source) {
            created.permissionsCopiedFrom = source;
        }

        return created;
    }
}

const CreateRoleToolHandler = AiSdkToolHandler.createImplementation({
    implementation: CreateRoleToolHandlerImpl,
    dependencies: [GetRoleUseCase, CreateRoleUseCase]
});

/**
 * Creates a role, empty or with the permissions of an existing one.
 *
 * The model never writes permission objects. They are app-specific records with keys the model
 * would have to guess, and the approval card would show a list of them the user cannot check. A
 * role it creates either starts empty, for the user to fill in on the Roles screen, or copies a
 * role the user names, which the approval shows by id.
 */
class CreateRoleToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "createRole";
    readonly title = "Create role";
    readonly description =
        "Creates a security role. It starts with no permissions, or with a copy of an existing role's permissions when `copyPermissionsFrom` is given (call listRoles for the id). Permissions cannot be written directly; the user edits them on the Roles screen. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = CreateRoleToolHandler;
}

export const CreateRoleTool = AiSdkToolDefinition.createImplementation({
    implementation: CreateRoleToolImpl,
    dependencies: []
});
