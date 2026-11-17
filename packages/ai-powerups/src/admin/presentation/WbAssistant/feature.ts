import { createFeature } from "@webiny/feature/admin";
import { AssistantClientTools } from "@webiny/app-admin";
import { AssistantPageContext } from "@webiny/app-admin";
import { ToolPipelineRunner } from "@webiny/app-admin";
import { ToolRegistry } from "@webiny/app-admin";

/**
 * What the page editor needs to hand the assistant its tools and describe the page. Everything is
 * registered by the admin already; this only resolves it for the editor's components.
 */
export const PageEditorAssistantFeature = createFeature({
    name: "WbAssistant/PageEditor",
    register() {},
    resolve(container) {
        return {
            clientTools: container.resolve(AssistantClientTools),
            pageContext: container.resolve(AssistantPageContext),
            pipelineRunner: container.resolve(ToolPipelineRunner),
            toolRegistry: container.resolve(ToolRegistry)
        };
    }
});
