/**
 * @jest-environment jsdom
 */

import { parseToLexicalObject } from "~/index";
import { simpleHtml } from "./html-articles";

describe("Test html-to-lexical parser", () => {
    it("should parse html string to lexical object", async () => {
        parseToLexicalObject(simpleHtml, data => {
            console.log("On success", data);
            expect(data).toEqual({ test: "string" });
        });
    });
});
