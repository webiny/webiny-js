import React from "react";
import { PageElementsProvider as PbPageElementsProvider } from "@webiny/app-page-builder-elements/contexts/PageElements";

// Elements.
import { createBlock } from "@webiny/app-page-builder-elements/renderers/block";
import { createButton } from "@webiny/app-page-builder-elements/renderers/button";
import { createCell } from "@webiny/app-page-builder-elements/renderers/cell";
import { createDocument } from "@webiny/app-page-builder-elements/renderers/document";
import { createGrid } from "@webiny/app-page-builder-elements/renderers/grid";
import { createHeading } from "@webiny/app-page-builder-elements/renderers/heading";
import { createList } from "@webiny/app-page-builder-elements/renderers/list";
import { createImage } from "@webiny/app-page-builder-elements/renderers/image";
import { createParagraph } from "@webiny/app-page-builder-elements/renderers/paragraph";
// import {createEmbeds} from "@webiny/app-page-builder-elements/renderers/embeds";
// import {createIcon} from "@webiny/app-page-builder-elements/renderers/icon";
// import {createPagesList} from "@webiny/app-page-builder-elements/renderers/pagesList";
// import {createQuote} from "@webiny/app-page-builder-elements/renderers/quote";

// Custom elements.
import { SpaceX } from "./spaceX/website";

// Styles modifiers.
import { createBackground } from "@webiny/app-page-builder-elements/modifiers/styles/background";
import { createBorder } from "@webiny/app-page-builder-elements/modifiers/styles/border";
import { createHeight } from "@webiny/app-page-builder-elements/modifiers/styles/height";
import { createHorizontalAlign } from "@webiny/app-page-builder-elements/modifiers/styles/horizontalAlign";
import { createMargin } from "@webiny/app-page-builder-elements/modifiers/styles/margin";
import { createPadding } from "@webiny/app-page-builder-elements/modifiers/styles/padding";
import { createShadow } from "@webiny/app-page-builder-elements/modifiers/styles/shadow";
import { createText } from "@webiny/app-page-builder-elements/modifiers/styles/text";
import { createVerticalAlign } from "@webiny/app-page-builder-elements/modifiers/styles/verticalAlign";
import { createWidth } from "@webiny/app-page-builder-elements/modifiers/styles/width";
// import {createVisibility} from "@webiny/app-page-builder-elements/modifiers/styles/visibility";
// import {createAnimation} from "@webiny/app-page-builder-elements/modifiers/styles/animation";

import { theme } from "./theme";

export const PageElementsProvider: React.FC = ({ children }) => (
    <PbPageElementsProvider
        theme={theme}
        renderers={{
            block: createBlock(),
            button: createButton(),
            cell: createCell(),
            document: createDocument(),
            grid: createGrid(),
            heading: createHeading(),
            list: createList(),
            image: createImage(),
            paragraph: createParagraph(),
            spaceX: SpaceX
        }}
        modifiers={{
            styles: {
                background: createBackground(),
                border: createBorder(),
                height: createHeight(),
                horizontalAlign: createHorizontalAlign(),
                margin: createMargin(),
                padding: createPadding(),
                shadow: createShadow(),
                text: createText(),
                verticalAlign: createVerticalAlign(),
                width: createWidth()
            }
        }}
    >
        {children}
    </PbPageElementsProvider>
);
