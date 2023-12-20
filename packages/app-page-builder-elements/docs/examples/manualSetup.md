# Manual Setup

An example of manually setting up the `PageElementsProvider`, with all of the default renderers and modifiers. Useful
when rendering pages in an external project, for example in a standalone Next.js application.

```tsx
import React from "react";
import { PageElementsProvider as PbPageElementsProvider } from "@webiny/app-page-builder-elements/PageElements";

// Elements.
import { createBlock } from "@webiny/app-page-builder-elements/renderers/block";
import { createButton } from "@webiny/app-page-builder-elements/renderers/button";
import { createCell } from "@webiny/app-page-builder-elements/renderers/cell";
import { createDocument } from "@webiny/app-page-builder-elements/renderers/document";
import { createGrid } from "@webiny/app-page-builder-elements/renderers/grid";
import { createHeading } from "@webiny/app-page-builder-elements/renderers/heading";
import { createList } from "@webiny/app-page-builder-elements/renderers/list";
import { createIcon } from "@webiny/app-page-builder-elements/renderers/icon";
import { createImage } from "@webiny/app-page-builder-elements/renderers/image";

import { createPagesList } from "@webiny/app-page-builder-elements/renderers/pagesList";
import { createDefaultDataLoader } from "@webiny/app-page-builder-elements/renderers/pagesList/dataLoaders";
import { createDefaultPagesListComponent } from "@webiny/app-page-builder-elements/renderers/pagesList/pagesListComponents";

import { createParagraph } from "@webiny/app-page-builder-elements/renderers/paragraph";
import { createQuote } from "@webiny/app-page-builder-elements/renderers/quote";

import { createTwitter } from "@webiny/app-page-builder-elements/renderers/embeds/twitter";
import { createPinterest } from "@webiny/app-page-builder-elements/renderers/embeds/pinterest";
import { createCodesandbox } from "@webiny/app-page-builder-elements/renderers/embeds/codesandbox";
import { createSoundcloud } from "@webiny/app-page-builder-elements/renderers/embeds/soundcloud";
import { createYoutube } from "@webiny/app-page-builder-elements/renderers/embeds/youtube";
import { createVimeo } from "@webiny/app-page-builder-elements/renderers/embeds/vimeo";

// Attributes modifiers.
import { createId } from "@webiny/app-page-builder-elements/modifiers/attributes/id";
import { createClassName } from "@webiny/app-page-builder-elements/modifiers/attributes/className";
import { createAnimation } from "@webiny/app-page-builder-elements/modifiers/attributes/animation";

// Styles modifiers.
import { createBackground } from "@webiny/app-page-builder-elements/modifiers/styles/background";
import { createBorder } from "@webiny/app-page-builder-elements/modifiers/styles/border";
import { createHeight } from "@webiny/app-page-builder-elements/modifiers/styles/height";
import { createHorizontalAlign } from "@webiny/app-page-builder-elements/modifiers/styles/horizontalAlign";
import { createMargin } from "@webiny/app-page-builder-elements/modifiers/styles/margin";
import { createPadding } from "@webiny/app-page-builder-elements/modifiers/styles/padding";
import { createShadow } from "@webiny/app-page-builder-elements/modifiers/styles/shadow";
import { createText } from "@webiny/app-page-builder-elements/modifiers/styles/text";
import { createTextAlign } from "@webiny/app-page-builder-elements/modifiers/styles/textAlign";
import { createVerticalAlign } from "@webiny/app-page-builder-elements/modifiers/styles/verticalAlign";
import { createVisiblity } from "@webiny/app-page-builder-elements/modifiers/styles/visibility";
import { createWidth } from "@webiny/app-page-builder-elements/modifiers/styles/width";

// A theme object. For more info, see:
// https://github.com/webiny/webiny-js/tree/dev/packages/theme
import { theme } from "./theme";

interface PageElementsProviderProps {
  children: React.ReactNode;
}

export const PageElementsProvider = ({ children }: PageElementsProviderProps) => (
  <PbPageElementsProvider
    theme={theme}
    renderers={{
      block: createBlock(),
      button: createButton({
        clickHandlers: [
          {
            id: "myHandler1",
            name: "My Handler 1",
            variables: [
              { name: "myVarName", label: "My Var Label", defaultValue: "My Default Value" }
            ],
            handler: (params: any) => {
              console.log("variable myVarName", params["myVarName"]);
            }
          },
          {
            id: "myHandler2",
            name: "My Handler 2",
            handler: () => {
              alert("Alert!");
            }
          }
        ]
      }),
      cell: createCell(),
      document: createDocument(),
      grid: createGrid(),
      heading: createHeading(),
      list: createList(),
      icon: createIcon(),
      image: createImage(),
      paragraph: createParagraph(),
      quote: createQuote(),
      twitter: createTwitter(),
      pinterest: createPinterest(),
      codesandbox: createCodesandbox(),
      soundcloud: createSoundcloud(),
      youtube: createYoutube(),
      vimeo: createVimeo(),
      "pages-list": createPagesList({
        dataLoader: createDefaultDataLoader({
          apiUrl: process.env.MY_WEBINY_GRAPHQL_API_URL,
          includeHeaders: {
            "x-tenant": "root"
          }
        }),
        pagesListComponents: {
          default: createDefaultPagesListComponent(),
          default2: createDefaultPagesListComponent(),
          default3: createDefaultPagesListComponent()
        }
      })
    }}
    modifiers={{
      attributes: {
        id: createId(),
        className: createClassName(),
        animation: createAnimation()
      },
      styles: {
        background: createBackground(),
        border: createBorder(),
        height: createHeight(),
        horizontalAlign: createHorizontalAlign(),
        margin: createMargin(),
        text: createText(),
        textAlign: createTextAlign(),
        padding: createPadding(),
        shadow: createShadow(),
        verticalAlign: createVerticalAlign(),
        visibility: createVisiblity(),
        width: createWidth()
      }
    }}
  >
    {children}
  </PbPageElementsProvider>
);
```
