import { parseLexicalObject } from "~/index";
import { listElementNode, simpleHCMSJson, simpleHeadingElementNode } from "~tests/test-data";
import { parseElement } from "~/parseElement";
import { defaultConfig } from "~tests/mocks";
import { createConfigMap } from "~/utils/createConfigMap";

describe("Test Lexical Parser", () => {
    it("Parse lexical object to flat structure", () => {
        const output = parseLexicalObject(simpleHCMSJson);

        expect(output).toEqual({
            html: `<p>Test CMS Title</p>`,
            tag: "h1",
            text: "Test CMS Title",
            type: "heading-element"
        });
    });

    it("parse lexical list", () => {
        const configMap = createConfigMap(defaultConfig);
        if (!configMap) {
            return;
        }

        const parsedElementObj = parseElement(listElementNode, configMap);

        expect(parsedElementObj).toEqual({
            html: `<ul><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>`,
            tag: "ul",
            text: "List item 1 List item 2 List item 3",
            type: "webiny-list"
        });
    });

    it("parse lexical heading", () => {
        const configMap = createConfigMap(defaultConfig);
        if (!configMap) {
            return;
        }

        const parsedElementObj = parseElement(simpleHeadingElementNode, configMap);

        expect(parsedElementObj).toEqual({
            html: `<h1>Test CMS Title</h1>`,
            tag: "h1",
            text: "Test CMS Title",
            type: "heading-element"
        });
    });

    it("parse lexical paragraph", () => {
        const configMap = createConfigMap(defaultConfig);
        if (!configMap) {
            return;
        }

        const parsedElementObj = parseElement(simpleHeadingElementNode, configMap);

        expect(parsedElementObj).toEqual({
            html: `<p>Test CMS Title</p>`,
            tag: "h1",
            text: "Test CMS Title",
            type: "heading-element"
        });
    });
});
