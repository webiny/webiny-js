# @webiny/react-rich-text-renderer

[![](https://img.shields.io/npm/dw/@webiny/react-rich-text-renderer.svg)](https://www.npmjs.com/package/@webiny/react-rich-text-renderer)
[![](https://img.shields.io/npm/v/@webiny/react-rich-text-renderer.svg)](https://www.npmjs.com/package/@webiny/react-rich-text-renderer)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A React component to render data coming from Webiny Headless CMS and Webiny Form Builder.

## About

Webiny uses https://editorjs.io/ as a go to Rich Text Editor, with some additional plugins. To speed up the rendering of
data for developers, we created this component with default renderers for block types that are used in Webiny by
default.

## Install

```
npm install --save @webiny/react-rich-text-renderer
```

Or if you prefer yarn:

```
yarn add @webiny/react-rich-text-renderer
```

## Usage

Fetch your data from Headless CMS, then pass it to the component like this:

```tsx
import {RichTextRenderer} from "@webiny/react-rich-text-renderer";

// Load content from Headless CMS (here we show what your content might look like).
const content = [
    {
        type: "paragraph",
        data: {
            text: "A well written paragraph of text can bring so much joy!",
            textAlign: "left",
            className: ""
        }
    }
];

// Mount the component
<RichTextRenderer data={content}/>;
```

## Adding custom renderers

You can override the default renderers or add new renderers for your custom block types like this:

```tsx
import {RichTextRenderer, RichTextBlockRenderer} from "@webiny/react-rich-text-renderer";

const customRenderers: Record<string, RichTextBlockRenderer> = {
    // Override the default renderer for "delimiter" block
    delimiter: block => {
        return <div data-type={block.type} className={"my-custom-delimiter"}/>;
    },
    // Add a renderer for "youtube" block
    youtube: block => {
        return (
            <iframe
                width="560"
                height="315"
                src={block.data.url}
                title={block.data.title}
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
            ></iframe>
        );
    }
};

const content = [
    // This block will use the default renderer
    {
        type: "paragraph",
        data: {
            text: "A well written paragraph of text can bring so much joy!",
            textAlign: "left",
            className: ""
        }
    },
    // This block will use the custom "delimiter" renderer
    {
        type: "delimiter"
    },
    // This block will use the new "youtube" renderer
    {
        type: "youtube",
        data: {
            url: "https://www.youtube.com/embed/gOGJKHXntiU",
            title: "Webiny Overview"
        }
    }
];

// Mount the component
<RichTextRenderer data={content} renderers={customRenderers}/>;
```

## Resolve the mismatch of the versions in the React v18 application

This component is using React `v17.0.2`, and it's possible to have an error in your React application that uses
version `18.x.x`.

You will see this error message on the screen:

```
You might have mismatching versions of React and the renderer (such as react dom).
```

To resolve that problem, open the `package.json` file in your project, add the `resolutions` field, and next,
set the `react` package name with the version of the React you have in the `dependencies` field.

```json package.json
{
  "dependences": {
    "react": "18.2.0",
    ...
  },
  ...
  "resolutions": {
    "react": "18.2.0"
  },
  ...
}
```

Then run `yarn install`.
