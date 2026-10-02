import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { LexicalParser } from "~/api/features/WbTranslatePage/LexicalParser.js";
import { LexicalParser as LexicalParserAbstraction } from "~/api/features/WbTranslatePage/abstractions/LexicalParser.js";

describe("LexicalParser", () => {
    it("should parse HTML into a Lexical state, loading the converter on first use", async () => {
        const container = new Container();
        container.register(LexicalParser);
        const parser = container.resolve(LexicalParserAbstraction);

        const first = await parser.parse("<p>Hello <b>world</b></p>");
        const second = await parser.parse("<p>Again</p>");

        expect(first).toMatchObject({ root: { type: "root" } });
        expect(JSON.stringify(first)).toContain("Hello");
        expect(JSON.stringify(second)).toContain("Again");
    });
});
