import { jsonSchema } from "ai";
import { tool } from "ai";
import type { JSONSchema7 } from "ai";
import type { ToolSet } from "ai";
import type { ClientToolDeclaration } from "./types.js";

/**
 * The client tools as the model is offered them. No `execute`: the SDK ends the run on a call to
 * one, and leaves it to the caller to supply the result.
 */
export const toClientToolSet = (declarations: ClientToolDeclaration[]): ToolSet => {
    const tools: ToolSet = {};
    for (const declaration of declarations) {
        const schema: JSONSchema7 = declaration.inputSchema;
        const inputSchema = jsonSchema(schema);
        tools[declaration.name] = tool({ description: declaration.description, inputSchema });
    }
    return tools;
};
