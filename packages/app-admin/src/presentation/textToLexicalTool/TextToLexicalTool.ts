import { z } from "zod";
import { Tool } from "~/exports/admin.js";
import { textToLexicalState } from "./textToLexicalState.js";
import { LexicalContext } from "~/exports/admin.js";

const inputSchema = z.object({
    text: z.string().describe("Text content")
});

const outputSchema = z
    .object({
        state: z.string().describe("Lexical editor state as JSON string"),
        html: z.string().describe("HTML representation of the content")
    })
    .describe("Lexical editor state with HTML");

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

class TextToLexicalToolImpl implements Tool.Interface<typeof inputSchema, typeof outputSchema> {
    readonly name = "textToLexical";
    readonly description =
        "Converts a plain text string into Lexical editor state. Use for all 'lexical' type inputs.";
    readonly inputSchema = inputSchema;
    readonly outputSchema = outputSchema;

    constructor(private lexicalContext: LexicalContext.Interface) {}

    async execute(input: Input): Promise<Output> {
        return textToLexicalState(this.lexicalContext, input.text);
    }
}

export const TextToLexicalTool = Tool.createImplementation({
    implementation: TextToLexicalToolImpl,
    dependencies: [LexicalContext]
});
