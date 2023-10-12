# @webiny/html-to-lexical-parser

[![](https://img.shields.io/npm/dw/@webiny/html-to-lexical-parser.svg)](https://www.npmjs.com/package/@webiny/llexical-html-to-lexical-parser)
[![](https://img.shields.io/npm/v/@webiny/html-to-lexical-parser.svg)](https://www.npmjs.com/package/@webiny/html-to-lexical-parser)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## About

This package provides features that will enable you to parse your HTML pages into Lexical editor state object.

Further, this lexical state object can be imported into Webiny's apps like the Page builder and Headless CMS, trough
the [Webiny's graphql API](https://www.webiny.com/docs/headless-cms/basics/graphql-api).

> Webiny use the Lexical editor as primary rich text editor across the platform.

Note: This module is built to be used in the `node.js` environment.

#### About Lexical editor

Lexical editor is product by Meta, provides rich text editing features, it's extensible and open source. In case you
are not familiar with the Lexical editor, please visit their official page
to [learn more](https://lexical.dev/docs/intro).

## Usage

To parse the html to lexical editor state object, you need to import `createHtmlToLexicalParser` factory function,
to create the parser function (with default or custom configuration) and provide the HTML content as parameter.
Parser will return Lexical editor state object.

> The parser uses the default configuration with the Webiny's Lexical nodes. DOM elements like headings and
> paragraph, for example, will be converted to our custom Webiny Lexical nodes.

```tsx
import {parseHtmlToLexical} from "@webiny/lexical-html-to-lexical-parser";

const htmlString = "<p>My paragraph</p>";

// Create a parser function.
const myParser = createHtmlToLexicalParser();

// Parse the html string to Ledxical editor state object. 
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

Next, you can import the parsed Lexical JSON in our Headless CMS through the Graphql API.

To find more about how to use our GraphQl API please check
our [GraphQL API Overview](https://www.webiny.com/docs/headless-cms/basics/graphql-api) article.

## Configuration

To configure the parser import `configureParser` method and provide the app level configuration options.

```ts
import {configureParser} from "@webiny/lexical-html-to-lexical-parser";
import {myCustomTheme} from "./theme/myCustomTheme";
import {MyCustomLexicalNode} from './lexical/nodes/MyCustomLexicalNode'

const addCustomThemeStyleToHeadings = (node: LexicalNode): LexicalNode => {
    if (node.getType() === "heading-element") {
        return (node as HeadingNode).setThemeStyles([
            {styleId: "my-default-id", type: "typography"}
        ]);
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
    normalizeTextNodes: true // by default is 'true'
});

const lexicalEditorState = myParser(htmlString);
```

To learn more about how to create custom Lexical nodes, please
visit [Lexical's documentation web page](https://lexical.dev/docs/intro).

### Configuration options

Configuration uses the `ParserConfigurationOptions` interface to define the configuration options for the parser.

By default, this parser configuration includes all lexical nodes from the @webiny/lexical-editor package.

| Prop               | Type                               | Default value               | Description                                                                                                                                                       |
|--------------------|------------------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| editorConfig       | CreateEditorArgs                   | { nodes: [allWebinyNodes] } | Configure the Lexical editor by providing the native editor configuration options ([link to docs](https://lexical.dev/docs/api/modules/lexical#createeditorargs)) |
| nodeMapper         | (node: LexicalNode) => LexicalNode |                             | Define custom mapper function to map the Lexical nodes.                                                                                                           |
| normalizeTextNodes | boolean                            | true                        | By default, parser will normalize the nodes and prevent unsupported nodes to be inserted in the Lexical state.                                                    |










