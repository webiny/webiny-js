/**
 * @jest-environment jsdom
 */

import { parseToLexicalObject } from "~/index";
import { carArticle } from "./html-articles";

describe("Test html-to-lexical parser", () => {
    it("should parse html string to lexical object", async () => {
        parseToLexicalObject(carArticle, data => {
            console.log("On success", data);
            expect(data).toEqual({ test: "string" });
        });
    });
});
