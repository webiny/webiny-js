/**
 * @jest-environment jsdom
 */
import { createHtmlToLexicalParser } from "~/index";
import { simpleHtml } from "./html-articles";

describe("Test html-to-lexical parser", () => {
    it("should parse html paragraph string to lexical object", async () => {
        const parser = createHtmlToLexicalParser();
        expect(parser(simpleHtml)).toMatchObject({
            root: {
                children: [
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Space",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: null,
                        format: "",
                        indent: 0,
                        styles: [],
                        type: "paragraph-element",
                        version: 1
                    }
                ],
                direction: null,
                format: "",
                indent: 0,
                type: "root",
                version: 1
            }
        });
    });
});
