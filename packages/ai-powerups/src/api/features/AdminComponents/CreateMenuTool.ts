import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { AdminComponentsRepository } from "./abstractions.js";
import { MENU_CONTRACT } from "./menuContract.generated.js";

/*
 * The stored shape. A menu is configuration rather than code, so this is the whole extension: there
 * is nothing to bundle, nothing to evaluate, and no way for it to fail at render time beyond
 * pointing at a path that does not resolve.
 */
export const menuConfigSchema = z.object({
    name: z.string(),
    label: z.string(),
    to: z.string(),
    parent: z.string().nullable(),
    pinnable: z.boolean()
});

const inputSchema = z.object({
    name: z
        .string()
        .describe(
            "Identifier for this menu item, unique across the whole sidebar. camelCase, no spaces. Not shown to anyone."
        ),
    label: z.string().describe("The text shown in the sidebar, e.g. 'Reports'."),
    to: z
        .string()
        .describe(
            "Path the item links to, e.g. '/reports'. It must already resolve; creating a menu item does not create the page."
        ),
    parent: z
        .string()
        .nullable()
        .describe(
            "Existing group to nest under: 'settings', 'settings.system', 'settings.security', 'headlessCMS', 'wb' or 'dev-tools'. Pass null for a top-level item. A group that does not exist hides the item."
        ),
    pinnable: z
        .boolean()
        .describe("Whether a user may pin this to the top of their sidebar. Usually true.")
});

type Input = z.infer<typeof inputSchema>;

class CreateMenuToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(private repository: AdminComponentsRepository.Interface) {}

    async execute(input: Input) {
        const component = await this.repository.create({
            kind: "menu",
            name: input.name,
            label: input.label,
            description: input.parent
                ? `Sidebar item under ${input.parent}, linking to ${input.to}.`
                : `Top-level sidebar item linking to ${input.to}.`,
            /* Renderer-only metadata. A menu is not selected per field, so it has no field type. */
            fieldType: "",
            appliesTo: "both",
            source: JSON.stringify(
                menuConfigSchema.parse({
                    name: input.name,
                    label: input.label,
                    to: input.to,
                    parent: input.parent,
                    pinnable: input.pinnable
                }),
                null,
                2
            )
        });

        return {
            id: component.id,
            name: component.name,
            note: `Saved. The item appears in the sidebar the next time the admin loads. It links to ${input.to}; if that path does not resolve, the item will lead to a blank page.`
        };
    }
}

const CreateMenuToolHandler = AiSdkToolHandler.createImplementation({
    implementation: CreateMenuToolHandlerImpl,
    dependencies: [AdminComponentsRepository]
});

/**
 * Adds an item to the admin sidebar.
 *
 * Needs approval like the other write tools, but for a milder reason than `createFieldRenderer`:
 * nothing here executes. The worst outcome is a sidebar item pointing at a path that does not
 * resolve, which is visible and reversible, rather than code running in someone's session.
 */
class CreateMenuToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "createMenu";
    readonly title = "Create menu item";
    readonly description = `Adds an item to the admin's left sidebar, linking to a path that already exists. Use this when someone asks to make a page reachable from the navigation. Requires user approval.\n\n${MENU_CONTRACT}`;
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = CreateMenuToolHandler;
}

export const CreateMenuTool = AiSdkToolDefinition.createImplementation({
    implementation: CreateMenuToolImpl,
    dependencies: []
});
