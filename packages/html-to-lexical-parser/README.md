# @webiny/lexical-html-to-lexical-parser

[![](https://img.shields.io/npm/dw/@webiny/lexical-html-to-lexical-parser.svg)](https://www.npmjs.com/package/@webiny/llexical-html-to-lexical-parser)
[![](https://img.shields.io/npm/v/@webiny/lexical-html-to-lexical-parser.svg)](https://www.npmjs.com/package/@webiny/lexical-html-to-lexical-parser)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## About

This package provides method for parsing html to lexical object.

## Usage

To parse the html string, you need to import `parseHtmlToLexical` function, and provide
the html string.

```tsx
import {parseHtmlToLexical} from "@webiny/lexical-html-to-lexical-parser";

const htmlString = "<p>My paragraph</p>";
const lexicalObject = parseHtmlToLexical(htmlString);
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

Next, you can import the parsed Lexical JSON in the Headless CMS app.
To find more about how to use our GraphQl API please check
our [GraphQL API Overview](https://www.webiny.com/docs/headless-cms/basics/graphql-api) article.

## Configuration

To configure the parser import `configureParser` method and provide the app level configuration options.

```ts
import {configureParser} from "@webiny/lexical-html-to-lexical-parser";
import {myCustomTheme} from "./theme/myCustomTheme";
import {MyCustomLexicalNode} from './lexical/nodes/MyCustomLexicalNode'

// App level configuration. 
configureParser({
    // Lexical editor configuration
    editorConfig: {
        // Add custom nodes for parsing
        nodes: [MyCustomLexicalNode],
        // Add you custom theme
        theme: myCustomTheme
    }
})
```

To learn more about how to create custom Lexical nodes or theme, please
visit [Lexical's documentation web page](https://lexical.dev/docs/intro).

### Configuration options

Configuration uses the `ParserConfigurationOptions` interface to define the configuration options for the parser.

By default, this parser configuration includes all lexical nodes from the @webiny/lexical-editor package.

| Property     | Type             | Default value | Description                                                      |
|--------------|------------------|---------------|------------------------------------------------------------------|
| editorConfig | CreateEditorArgs | { nodes: [] } | Provide the original lexical interface for editor configuration. |

By providing the `editorConfig` configuration, we can add custom Lexical nodes, custom theme and other editor related
options.

Please check the full type definition, of the Lexical `CreateEditorArgs`, on the
following [link](https://lexical.dev/docs/api/modules/lexical#createeditorargs).








