import { createFeature } from "@webiny/feature/api";
import { CreatePageTool } from "./CreatePageTool.js";

/**
 * Website Builder tools for AI callers. Building and changing a page's content is done in the page
 * editor, by tools the editor runs in the browser; the API only creates the page.
 */
export const WbAiToolsFeature = createFeature({
    name: "Wb/AiTools",
    register(container) {
        container.register(CreatePageTool);
    }
});
