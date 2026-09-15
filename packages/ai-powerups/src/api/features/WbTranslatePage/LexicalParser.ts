import { createHtmlToLexicalParser } from "@webiny/lexical-converter";
import { LexicalParser as Abstraction } from "./abstractions/LexicalParser.js";

const parser = createHtmlToLexicalParser();

class LexicalParserImpl implements Abstraction.Interface {
    private WindowClass: typeof import("happy-dom").Window | null = null;

    async parse(html: string): Promise<Record<string, unknown> | null> {
        try {
            const Window = await this.loadWindow();
            const window = new Window();
            const document = window.document;
            document.body.innerHTML = html;
            const result = parser(document as unknown as Document);
            await window.happyDOM.close();
            return result;
        } catch (error) {
            console.error("[LexicalParser] Failed to parse HTML to Lexical state:", error);
            console.error("[LexicalParser] Input HTML:", html);
            return null;
        }
    }

    private async loadWindow() {
        if (!this.WindowClass) {
            const { Window } = await import("happy-dom");
            this.WindowClass = Window;
        }
        return this.WindowClass;
    }
}

export const LexicalParser = Abstraction.createImplementation({
    implementation: LexicalParserImpl,
    dependencies: []
});
