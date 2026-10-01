import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/exports/api.js";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";

/**
 * Sent to the user's open admin tabs after the assistant creates a folder. The admin keeps its own
 * folder cache, and a folder created on the server never passes through it, so without this the new
 * folder only shows up after a reload. Carries the id only; the admin reads the folder back itself.
 */
export const FOLDER_CREATED_WEBSOCKET_ACTION = "aco.folder.created";

const inputSchema = z.object({
    title: z.string().describe("Human-readable folder name, e.g. 'Marketing'."),
    slug: z
        .string()
        .describe("URL-safe identifier, e.g. 'marketing'. Lowercase, hyphens instead of spaces."),
    type: z
        .string()
        .describe(
            "Folder namespace: 'FmFile' for File Manager, or 'cms:<modelId>' for a content model's folders."
        ),
    parentId: z
        .string()
        .optional()
        .describe("Id of the parent folder. Omit to create at the root of that namespace.")
});

type Input = z.infer<typeof inputSchema>;

interface CreatedFolder {
    id: string;
    title: string;
    slug: string;
    path: string;
    type: string;
}

class CreateFolderToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private createFolder: CreateFolderUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async execute(input: Input): Promise<CreatedFolder> {
        const params: {
            title: string;
            slug: string;
            type: string;
            parentId: string | null;
        } = {
            title: input.title,
            slug: input.slug,
            type: input.type,
            parentId: null
        };

        if (input.parentId) {
            params.parentId = input.parentId;
        }

        const result = await this.createFolder.execute(params);

        if (result.isFail()) {
            throw new Error(`Could not create the folder: ${result.error.message}`);
        }

        const folder = result.value;

        await this.notifyCreated(folder.id);

        return {
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            path: folder.path,
            type: folder.type
        };
    }

    /*
     * The folder exists whether or not the message goes out, so the send's result is not the tool's
     * result. When it fails, the admin shows the folder after its next reload, as it did before.
     */
    private async notifyCreated(id: string) {
        const identity = this.identityContext.getIdentity();
        await this.sendToIdentity.execute(
            { id: identity.id },
            { action: FOLDER_CREATED_WEBSOCKET_ACTION, data: { id } }
        );
    }
}

const CreateFolderToolHandler = AiSdkToolHandler.createImplementation({
    implementation: CreateFolderToolHandlerImpl,
    dependencies: [CreateFolderUseCase, IdentityContext, WebsocketsSendToIdentityUseCase]
});

/**
 * Creates a folder.
 *
 * Additive and reversible, so it is not flagged destructive — but it still changes the project, so it
 * is not read-only either and therefore needs the user to approve the exact arguments.
 */
class CreateFolderToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "createFolder";
    readonly title = "Create folder";
    readonly description =
        "Creates a folder in the File Manager ('FmFile') or under a content model ('cms:<modelId>'). Call listFolders first to pick a parent, or omit parentId for the root. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = CreateFolderToolHandler;
}

export const CreateFolderTool = AiSdkToolDefinition.createImplementation({
    implementation: CreateFolderToolImpl,
    dependencies: []
});
