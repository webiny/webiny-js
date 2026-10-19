import { z } from "zod";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { CreateAdminExtensionUseCase } from "~/api/adminExtensions/features/CreateAdminExtension/abstractions.js";
import { MENU_PARENTS } from "~/shared/adminExtensions/menuSource.js";
import type { MenuSource } from "~/shared/adminExtensions/menuSource.js";

const inputSchema = z.object({
    name: z
        .string()
        .describe(
            "Identifier for this item, e.g. 'release-notes'. Lowercase letters, digits and dashes, starting with a letter. Not shown to anyone, and unique among generated menus."
        ),
    label: z.string().describe("The text shown in the sidebar, e.g. 'Release notes'."),
    to: z
        .string()
        .describe(
            "Admin path the item links to, starting with a single slash, e.g. '/cms/content-entries/article'. It must already resolve: this tool does not create the page."
        ),
    parent: z
        .enum(MENU_PARENTS)
        .nullable()
        .describe(
            "Existing sidebar group to nest under: 'settings', 'settings.system', 'settings.security', 'headlessCMS' (Content Modeling), 'wb' (Website Builder) or 'dev-tools'. Null for a top-level item."
        ),
    pinnable: z
        .boolean()
        .describe("Whether a user may pin the item to the top of their sidebar. Usually true.")
});

type Input = z.infer<typeof inputSchema>;

interface CreatedMenu {
    id: string;
    name: string;
    note: string;
}

class CreateMenuToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(private readonly createAdminExtension: CreateAdminExtensionUseCase.Interface) {}

    async execute(input: Input): Promise<CreatedMenu> {
        const menu: MenuSource = {
            label: input.label,
            to: input.to,
            parent: input.parent,
            pinnable: input.pinnable
        };

        const result = await this.createAdminExtension.execute({
            kind: "menu",
            name: input.name,
            label: input.label,
            description: `Sidebar item linking to ${input.to}.`,
            source: JSON.stringify(menu)
        });

        if (result.isFail()) {
            throw new Error(`Could not create the menu item: ${result.error.message}`);
        }

        return {
            id: result.value.id,
            name: result.value.name,
            note: "Saved. The item appears in the sidebar the next time the admin loads, and can be disabled or deleted under Settings, System, Admin extensions."
        };
    }
}

const CreateMenuToolHandler = AiSdkToolHandler.createImplementation({
    implementation: CreateMenuToolHandlerImpl,
    dependencies: [CreateAdminExtensionUseCase]
});

/**
 * Adds an item to the admin sidebar.
 *
 * Needs approval like every write tool. Nothing here runs code: the worst outcome is an item that
 * points at a path that does not resolve, which is visible and can be disabled.
 */
class CreateMenuToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "createMenu";
    readonly title = "Create menu item";
    readonly description = [
        "Adds an item to the admin's left sidebar that links to an admin page which already exists. Use it when someone wants a page reachable from the navigation. Requires user approval.",
        "The item is configuration, not code: there is nothing to import and no component to write. It is text only, with no icon.",
        "If the destination does not exist yet, say so instead of creating an item that leads to a blank page. Pick a parent only from the listed groups; any other parent would hide the item."
    ].join("\n\n");
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = CreateMenuToolHandler;
}

export const CreateMenuTool = AiSdkToolDefinition.createImplementation({
    implementation: CreateMenuToolImpl,
    dependencies: []
});
