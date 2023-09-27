# @webiny/lexical-parser

[![](https://img.shields.io/npm/dw/@webiny/lexical-parser-actions.svg)](https://www.npmjs.com/package/@webiny/lexical-editor)
[![](https://img.shields.io/npm/v/@webiny/lexical-parser.svg)](https://www.npmjs.com/package/@webiny/lexical-editor)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## About

This package allows you to parse Lexical editor's JSON object to array of custom objects.

As a key features of this lexical parser are the transformer methods. Those methods give you the control to customize
the content in following three key points:

- Customize the HTML tag by matched node
- Customize the plain text by matched node
- Customize the output by matched object

These transformer methods will be covered under the `transformers` topic.

> You can find more information for the `Lexical editor` and lexical nodes on following [link](https://lexical.dev/).

## Parse the lexical data

To parse the lexical data you need to import the `parseLexicalobject` method and parse the content from the
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

This is how the output of the parsed nodes objects looks like.

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

These parsed custom object, by default, contains the `order` of the lexical node occurrence, option to export parsed
plain text or html in the `text` prop and to define custom `type` name.

## Configuration

Parser can be configured globally, on app level, or per single parsing.

You can configure the parser globally by importing the `configureLexicalParser` method. This method will allow to
specify the configuration object for the lexical parser.

This method accepts objects with `LexicalParserConfig` type. Here we can specify a list of lexical configuration
objects. In this configuration object you can specify the `elementNode` and the transformer
callbacks `textTransformer`, `htmlTransformer` and `outputTransformer`.

In `elementNode` you must specify the lexical node type you want to match and parse. Additionally, you can define
output, html tag and text parsing option with following props:

- With `type` prop you must define the lexical node type to match. Example: `paragraph-element`,
- With `outputType` prop you can define the type you want to be set in the output `type` object. For example lexical
  node type is `paragraph-element`, but, after the parsing, for the output `type` prop we want type name to be
  only `heading`.
- `tag` prop allows you to specify the html tag you want to have this element. If it's not specified, it will try to
  parse from the lexical node `tag` prop, if existing. For example for `headings` you don't need to specify the `tag`
  prop.
- `outputTextAsHtml` will match the output `text` prop and set the parsed lexical content in plain text, id it's set
  to `false` or html content if it's set to `true`.

You can specify transformer callback functions in the following props:

- `textTransformer` prop allows you to specify a method where customize the already parsed plain text.
- `htmlTransformer` prop allows you to specify a method where customize the parsed html content.
- `outputTransformer` - prop allows you to specify a method where you can customize the output object.

> By default, the parser have configuration for following Webiny's lexical nodes:
> `paragraph-element`, `paragraph`, `heading-element`, `heading`, `webiny-quote`, `quote`,
> `webiny-list`, `webiny-listitem`, `link-node` and `link`.
>
> Please check all available Webiny lexical nodes on
> following [GitHub link](https://github.com/webiny/webiny-js/blob/next/packages/lexical-editor/src/nodes/webinyNodes.ts).

```ts
import {parseLexicalObject, parseLexicalObject} from "@webiny/lexical-parser";

export const mydDfaultConfig: LexicalParserConfig = [
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
        outputTransformer: (
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
];

// Apply the configuration
configureLexicalParse(mydDfaultConfig);

// Parse the lexical object
const output = parseLexicalObject(lexicalCmsObject);

// New config only for this parsing
export const otherConfig: LexicalParserConfig = [
    {
        elementNode: {
            type: "heading-element",
            outputType: "headings",
            outputTextAsHtml: true
        }
    }];

const output1 = parseLexicalObject(lexicalCmsObject, otherConfig);
```

## Transformers

### Create custom HTML content with `htmlTransformer` transformer

We can customize how the html is generated for specific lexical node. In this example we took the link node and created
custom html transformer method.

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
            htmlTransformer: (parsedElement: ParsedElementNode, linkNode) => {
                return `<a href="${linkNode?.url}">${parsedElement.text}</a>`;
            }
        }
    ]
};
```

We can access to the `text` and `html` content through the `parsedElement`. This object contains the data of
the current matched and parsed lexical node. With the transformer you can use the default parsed data and
return custom result.

The output for the link node will be:

```tsx
const output = [
    {
        order: 1,
        text: "<a href=\"https://space.com\">link</a>",
        type: "link",
    },
    ...
];
```

### Create custom plain text content with `textTransformer` transformer

```ts
export const mydDfaultConfig: LexicalParserConfig = {
    processors: [
        {
            elementNode: {
                type: "paragraph-element", // lexical node type
                outputType: "paragraph", // output node type name
                tag: "p"
            },
            textTransformer: (parsedElement: ParsedElementNode, linkNode) => {
                if (parsedElement.text.trim().length === 0) {
                    return `N/A`;
                }
                return parsedElement.text;
            }
        }
    ]
};
```

The output for the node will be:

```tsx
const output = [
    {
        order: 1,
        text: "N/A",
        type: "paragraph",
    },
    ...
];
```

### Create custom output for a specific node with `outputTransformer` transformer

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
            outputTransformer: (
                parsedElement: ParsedElementNode,
                lexicalNode: Record<string, any>,
                index: number,
                config
            ) => {
                // create custom output when paragraph node is matched
                return {
                    order: index, // default
                    type: config?.elementNode.outputType, // default
                    text: `<div>${parsedElement.html}</div>`, // default
                    customField: "custom text" // new field for this node
                };
            }
        }
    ]
};

```

The output for the paragraph node will be:

```tsx
const output = [
    {
        order: 1,
        text: "<div><p>Test CMS paragraphs</p></div>",
        type: "paragraph",
        customField: "custom text"
    },
    ...
];
```
