import { z } from "zod";
import pick from "lodash/pick.js";
import type { ToolRegistry } from "@webiny/app-admin";

/**
 * The value tools (`textToLexical`, `resolveImage`, ...) as a model writes them: name, description
 * and the shape of the input and output. A model wraps a value in `{ tool, params }` and the
 * `ToolPipelineRunner` turns it into the real value. Shared by the one-shot page generator and the
 * assistant's page editor tools.
 */
export const describeValueTools = (toolRegistry: ToolRegistry.Interface) => {
    return toolRegistry.getTools().map(tool => {
        const inputSchema = z.toJSONSchema(tool.inputSchema);
        const outputSchema = z.toJSONSchema(tool.outputSchema);
        return {
            name: tool.name,
            description: tool.description,
            inputSchema: pick(inputSchema, ["properties", "type"]),
            outputSchema: pick(outputSchema, ["properties", "type"])
        };
    });
};
