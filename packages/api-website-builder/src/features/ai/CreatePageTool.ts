import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";

const inputSchema = z.object({
    title: z.string().describe("Page title, e.g. 'Bike Workshop'."),
    path: z
        .string()
        .describe(
            "URL path of the page, starting with a slash, e.g. '/bike-workshop'. Lowercase, hyphens instead of spaces."
        ),
    folderId: z
        .string()
        .optional()
        .describe("Folder to create the page in, as returned by listFolders. Omit it for the root.")
});

type Input = z.infer<typeof inputSchema>;

interface CreatedPage {
    id: string;
    title: string;
    path: string;
    /**
     * Where the page opens in the admin, for the link the model gives the user. `assistant=build`
     * tells the editor to open the assistant and carry on the chat by building the page.
     */
    editorPath: string;
}

class CreatePageToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(private createPage: CreatePageUseCase.Interface) {}

    async execute(input: Input): Promise<CreatedPage> {
        // What the admin's "New page" dialog sends: an empty page has its root element and nothing else.
        const result = await this.createPage.execute({
            location: { folderId: input.folderId ?? "root" },
            properties: { title: input.title, path: input.path },
            metadata: { documentType: "page", pageType: "static" },
            elements: {
                root: {
                    type: "Webiny/Element",
                    id: "root",
                    component: { name: "Webiny/Root" }
                }
            },
            bindings: {},
            extensions: {}
        });

        if (result.isFail()) {
            throw new Error(`Could not create the page: ${result.error.message}`);
        }

        const page = result.value;

        return {
            id: page.id,
            title: page.properties.title,
            path: page.properties.path,
            editorPath: `/website-builder/pages/editor/${encodeURIComponent(page.id)}?assistant=build`
        };
    }
}

const CreatePageToolHandler = AiSdkToolHandler.createImplementation({
    implementation: CreatePageToolHandlerImpl,
    dependencies: [CreatePageUseCase]
});

/**
 * Creates an empty page, from any screen. The page is built in the page editor, where the assistant
 * gets the tools that add elements, so this only creates it and hands back the link to open it.
 */
class CreatePageToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "createPage";
    readonly title = "Create page";
    readonly description =
        "Creates an empty Website Builder page as an unpublished draft. Use it when the user asks for a new page while not in the page editor. The page is built in the page editor, not here: after it is created, answer with a markdown link to `editorPath` (e.g. [Open Bike Workshop](/website-builder/pages/editor/...)) and say you will build the page there. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = CreatePageToolHandler;
}

export const CreatePageTool = AiSdkToolDefinition.createImplementation({
    implementation: CreatePageToolImpl,
    dependencies: []
});
