import { LexicalParser as Abstraction } from "./abstractions/LexicalParser.js";

type HtmlToLexicalParser = ReturnType<
    typeof import("@webiny/lexical-converter").createHtmlToLexicalParser
>;

class LexicalParserImpl implements Abstraction.Interface {
    private WindowClass: typeof import("happy-dom").Window | null = null;
    private parser: HtmlToLexicalParser | null = null;

    async parse(html: string): Promise<Record<string, unknown> | null> {
        try {
            const Window = await this.loadWindow();
            const parser = await this.loadParser();
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

    // The converter brings in lexical, cheerio and undici, so it's loaded on first use instead of
    // on every cold start. Importing undici also swaps the dispatcher behind the global fetch.
    private async loadParser() {
        if (!this.parser) {
            const { createHtmlToLexicalParser } = await import("@webiny/lexical-converter");
            this.parser = createHtmlToLexicalParser();
        }
        return this.parser;
    }
}

export const LexicalParser = Abstraction.createImplementation({
    implementation: LexicalParserImpl,
    dependencies: []
});
