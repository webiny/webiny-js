# @webiny/lexical-html-to-lexical-parser

[![](https://img.shields.io/npm/dw/@webiny/lexical-html-to-lexical-parser.svg)](https://www.npmjs.com/package/@webiny/llexical-html-to-lexical-parser)
[![](https://img.shields.io/npm/v/@webiny/lexical-html-to-lexical-parser.svg)](https://www.npmjs.com/package/@webiny/lexical-html-to-lexical-parser)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## About

This package provides method for parsing html to lexical.

## Usage

To parse the html string, you need to import `parseHtmlToLexical` function, and provide
the html string.

```tsx
import {parseHtmlToLexical} from "@webiny/lexical-html-to-lexical-parser";

const html = "<p>My paragraph</p>";

parseHtmlToLexical(html, data => {
        // success
        console.log("data is parsed")
    },
    error => {
        // error
        console.log("error", error.message);
    });
```






