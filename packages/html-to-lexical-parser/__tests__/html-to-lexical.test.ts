/**
 * @jest-environment jsdom
 */

import { parseToLexicalObject } from "~/index";
import { simpleHtml } from "./html-articles";

describe("Test html-to-lexical parser", () => {
    it("should parse html string to lexical object", async () => {
        parseToLexicalObject(simpleHtml, data => {
            expect(data).toMatchObject({
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
});
