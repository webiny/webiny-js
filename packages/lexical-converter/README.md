# @webiny/lexical-converter

[![](https://img.shields.io/npm/dw/@webiny/lexical-converter.svg)](https://www.npmjs.com/package/@webiny/llexical-lexical-converter)
[![](https://img.shields.io/npm/v/@webiny/lexical-converter.svg)](https://www.npmjs.com/package/@webiny/lexical-converter)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## About

This package provides features that will enable you to parse your HTML pages into Lexical editor state object.

Further, this lexical state object can be imported into Webiny's apps like the Page builder and Headless CMS, trough the [Webiny's graphql API](https://www.webiny.com/docs/headless-cms/basics/graphql-api).

> Webiny use the Lexical editor as primary rich text editor across the platform.

Note: This module is built to be used in the `node.js` environment.

## Usage

To parse the HTML to lexical editor state object, you need to import `createHtmlToLexicalParser` factory function,
to create the parser function (with default or custom configuration) and provide the HTML content as parameter.
Parser will return Lexical editor state object.

> The parser uses the default configuration with the Webiny's Lexical nodes. DOM elements like headings and
> paragraph, for example, will be converted to our custom Webiny Lexical nodes.

```tsx
import { createHtmlToLexicalParser } from "@webiny/lexical-converter";

const htmlString = "<p>My paragraph</p>";

// Create a parser function.
const myParser = createHtmlToLexicalParser();

// Parse the HTML string to Lexical editor state object.
const lexicalEditorState = myParser(htmlString);
```

Here is the result in JSON format. This object structure is a valid Lexical editor state.

```json
{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Space",
            "type": "text",
            "version": 1
          }
        ],
        "direction": null,
        "format": "",
        "indent": 0,
        "styles": [],
        "type": "paragraph-element",
        "version": 1
      }
    ],
    "direction": null,
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}
```

## Configuration

To configure the parser, you can pass an optional configuration object to the parser factory.

```ts
import { createHtmlToLexicalParser } from "@webiny/lexical-converter";
import { myCustomTheme } from "./theme/myCustomTheme";
import { MyCustomLexicalNode } from "./lexical/nodes/MyCustomLexicalNode";

const addCustomThemeStyleToHeadings = (node: LexicalNode): LexicalNode => {
  if (node.getType() === "heading-element") {
    return (node as HeadingNode).setThemeStyles([{ styleId: "my-default-id", type: "typography" }]);
  }
  return node;
};

// Create your parser with custom configuration
const myParser = createHtmlToLexicalParser({
  // Lexical editor configuration
  editorConfig: {
    // Add custom nodes for parsing
    nodes: [MyCustomLexicalNode],
    // Add you custom theme
    theme: myCustomTheme
  },
  nodeMapper: addCustomThemeStyleToHeadings,
  normalizeTextNodes: false // Default: true
});

const lexicalEditorState = myParser(htmlString);
```

To learn more about how to create custom Lexical nodes, please visit [Lexical's documentation web page](https://lexical.dev/docs/intro).
