import { createFeature } from "@webiny/feature/admin";
import { TextToLexicalTool } from "./TextToLexicalTool.js";

export const TextToLexicalToolFeature = createFeature({
    name: "Tools/TextToLexicalTool",
    register(container) {
        container.register(TextToLexicalTool);
    }
});
