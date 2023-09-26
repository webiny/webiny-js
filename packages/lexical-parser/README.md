# @webiny/lexical-parser

[![](https://img.shields.io/npm/dw/@webiny/lexical-parser-actions.svg)](https://www.npmjs.com/package/@webiny/lexical-editor)
[![](https://img.shields.io/npm/v/@webiny/lexical-parser.svg)](https://www.npmjs.com/package/@webiny/lexical-editor)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## About

This package provides method for parsing lexical object to custom json structure.

> important note: This is not final version of the package it's only PoC, and we are not recommending to use this code
> in production.

## Parse the lexical data

To parse the lexical data simply you need to import the `parseLexicalobject` method and parse the content from the
Webiny's Headless CMS.

```tsx
import {parseLexicalObject} from "@webiny/lexical-parser";

const cmsLexicalData = {
    root: {
        children: [
            {
                children: [
                    {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Test CMS Title",
                        type: "text",
                        version: 1
                    }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "heading-element",
                version: 1,
                tag: "h1",
                styles: [
                    {
                        styleId: "heading1",
                        type: "typography"
                    }
                ]
            }
            // other nodes
            ...
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1
    }
};


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

In order parser to recognize the lexical nodes, we need to configure the parser by importing
the `configureLexicalParser`. This method will allow to specify the configuration object for the lexical parser.

This method accepts object with `LexicalParserConfig` type. Here we can specify a list of processors, we need to
configure the lexical nodes, create custom html and output processor callbacks.

In the code below, we can see how we can configure the nodes.

```ts
import {parseLexicalObject, parseLexicalObject} from "@webiny/lexical-parser";

export const mydDfaultConfig: LexicalParserConfig = {
    processors: [
        {
            elementNode: {
                type: "heading-element",
                outputType: "headings",
                outputTextAsHtml: true
            }
        },
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
        },
        {
            elementNode: {
                type: "webiny-list",
                outputType: "list",
                outputTextAsHtml: true
            }
        },
        {
            elementNode: {
                type: "webiny-listitem",
                outputType: "list-item",
                tag: "li",
                outputTextAsHtml: true
            }
        },
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

// apply the configuration
configureLexicalParse(mydDfaultConfig);

// parse the lexical object
const output = parseLexicalObject(lexicalCmsObject);
```

### Create custom HTML tag for a specific node

we can customize how the html is generated for specific lexical node. In this example we took the link node and created
custom html processor method.

```ts
export const mydDfaultConfig: LexicalParserConfig = {
    processors: [
        {
            elementNode: {
                type: "link", // lexical node type
                outputType: "link", // output node type name
                tag: "a", // html tag if data don't have one
                outputTextAsHtml: true // output to be as html or plain text
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
export const mydDfaultConfig: LexicalParserConfig = {
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
