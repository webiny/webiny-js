# @webiny/lexical-parser

[![](https://img.shields.io/npm/dw/@webiny/lexical-parser-actions.svg)](https://www.npmjs.com/package/@webiny/lexical-editor)
[![](https://img.shields.io/npm/v/@webiny/lexical-parser.svg)](https://www.npmjs.com/package/@webiny/lexical-editor)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## About

This package provides method for parsing lexical editor object to custom json structure.

> important note: This is not final version of the package, and we are not recommending to use this code in production.

## Parse the lexical data

To parse the lexical data simply you need to import the `parseLexicalobject` method and parse the content from the
Webiny's Headless CMS.

```tsx
import {parseLexicalObject} from "@webiny/lexical-parser";

// This is how it looks the Lexical json from the Headlelss CMS
const output = parseLexicalObject(cmsLexicalData);
```

This is how the output of the parsed node objects looks like.

```tsx
const output = [
    {
        order: 1,
        text: "<h1>Test CMS Title </h1>",
        type: "headings",
    },
    {
        order: 2,
        text: "<ul><li>List item 1 </li><li>List item 2</li> <li>List item 3</li></ul>",
        type: "list",
    },
    {
        order: 3,
        text: "Test CMS paragraph",
        type: "paragraph",
    },
    ...
];
```

Output is array of parsed and customized objects that represents the lexical parsed nodes. Parser can be configured to
export plain text or html in the `text` field. We will cover this in the next topic.

### Configure the nodes

### Create custom HTML tag for a specific node

we can customize how the html is generated for specific lexical node. In this example we took the link node and created
custom html processor method.

```ts
export const defaultConfig: LexicalParserConfig = {
    processors: [
        {
            elementNode: {
                type: "link",
                outputType: "link",
                tag: "a",
                outputTextAsHtml: true
            },
            htmlProcessor: (parsedElement: ElementNode, linkNode) => {
                return `<a href="${linkNode?.url}">${parsedElement.text}</a>`;
            }
        }
    ]
};

```

Now the output for the link node will be:

```tsx
const output = [
    {
        order: 1,
        text: " Testing a <a href=\"https://space.com\">link</a> for parsing",
        type: "paragraph",
    },
    ...
];
```

### Create custom output for a specific node

You can customize the output of the parsed node in a following way:

```ts
export const defaultConfig: LexicalParserConfig = {
    processors: [
        {
            elementNode: {
                type: "paragraph-element",
                outputType: "paragraph",
                tag: "p",
                outputTextAsHtml: true
            },
            outputProcessor: (
                parsedElement: ElementNode,
                lexicalNode: Record<string, any>,
                index: number,
                config
            ) => {
                // create custom output when paragraph node is matched
                return {
                    order: index,
                    type: config?.elementNode.outputType,
                    text: `<div>${parsedElement.html}</div>`
                };
            }
        }
    ]
};

```

Now the output for the paragraph node will be:

```tsx
const output = [
    {
        order: 1,
        text: "<div><p>Test CMS paragraphs</p></div>",
        type: "paragraph",
    },
    ...
];
```
