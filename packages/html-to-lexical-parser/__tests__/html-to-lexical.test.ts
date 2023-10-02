/**
 * @jest-environment jsdom
 */

import { parseToLexicalObject } from "~/index";

describe("Test html-to-lexical parser", () => {
    it("should parse html string to lexical object", async () => {
        const lexicalObject = parseToLexicalObject(carArticle);
        expect(lexicalObject).toEqual({ test: "string" });
    });
});
