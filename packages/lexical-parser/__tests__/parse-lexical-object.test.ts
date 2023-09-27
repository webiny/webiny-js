import { parseLexicalObject } from "~/index";
import { cmsFieldInputData } from "~tests/test-data";
import { NodeContentOutput } from "~/types";

describe("Test Lexical Parser", () => {
    it("Parse lexical object to array of custom parsed objects", () => {
        const output = parseLexicalObject(cmsFieldInputData);

        expect(output).toEqual([
            {
                order: 1,
                text: `<h1>
             Test CMS Title
            </h1>`,
                type: "heading"
            },
            {
                order: 2,
                text: "<br>",
                type: "paragraph"
            },
            {
                order: 3,
                text: `<p>
             Testing a <a href=\"https://space.com\">link</a> for parsing
            </p>`,
                type: "paragraph"
            },
            {
                order: 4,
                text: `<p>
             Test CMS Paragraph
            </p>`,
                type: "paragraph"
            },
            {
                order: 5,
                text: "<br>",
                type: "paragraph"
            },
            {
                order: 6,
                text: `<quoteblock>
             Test quote from lexical CMS
            </quoteblock>`,
                type: "quote"
            },
            {
                order: 7,
                text: "<br>",
                type: "paragraph"
            },
            {
                order: 8,
                text: `<ul>
             <li>             List item 1            </li><li>             List item 2            </li><li>             List item 3            </li>
            </ul>`,
                type: "list"
            },
            {
                order: 9,
                text: "<br>",
                type: "paragraph"
            },
            {
                order: 10,
                text: "<br>",
                type: "paragraph"
            }
        ] as NodeContentOutput[]);
    });
});
