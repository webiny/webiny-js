import { createHtmlToLexicalParser } from "~/index";
import { headingH1Html, htmlWithNotSupportedHtmlTags } from "./test-data";
import { LexicalNode } from "lexical";
import { HeadingNode } from "@webiny/lexical-editor/nodes/HeadingNode";

describe("Test how parser configuration options", () => {
    it("should be able to turn off default node text node normalizer", async () => {
        const parser = createHtmlToLexicalParser({ normalizeTextNodes: false });

        /** By removing the default text node normalizer, text nodes can't exist alone, so we expect error to be thrown.
         * Error #56 on the lexical website: https://lexical.dev/docs/error?code=56
         */
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const nodes = parser(htmlWithNotSupportedHtmlTags);
        } catch (e) {
            expect(e.message).toMatch(e.message.contains("Minified Lexical error #56;"));
        }
    });

    it("should be able to add custom node mapper", async () => {
        const addCustomThemeStyleToHeadings = (node: LexicalNode): LexicalNode => {
            if (node.getType() === "heading-element") {
                return (node as HeadingNode).setThemeStyles([
                    { styleId: "my-default-id", type: "typography" }
                ]);
            }
            return node;
        };

        const parser = createHtmlToLexicalParser({ nodeMapper: addCustomThemeStyleToHeadings });
        expect(parser(headingH1Html)).toMatchObject({
            root: {
                children: [
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Testing heading h1 element",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: null,
                        format: "",
                        indent: 0,
                        tag: "h1",
                        type: "heading-element",
                        version: 1,
                        // modified by node mapper
                        styles: [{ styleId: "my-default-id", type: "typography" }]
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
