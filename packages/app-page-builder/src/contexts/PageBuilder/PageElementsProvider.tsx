import React from "react";
import { PageElementsProvider as PbPageElementsProvider } from "@webiny/app-page-builder-elements/contexts/PageElements";

// Elements.
// import { createBlock } from "@webiny/app-page-builder-elements/renderers/block";
// import { createButton } from "@webiny/app-page-builder-elements/renderers/button";
// import { createCell } from "@webiny/app-page-builder-elements/renderers/cell";
// import { createDocument } from "@webiny/app-page-builder-elements/renderers/document";
// import { createGrid } from "@webiny/app-page-builder-elements/renderers/grid";
// import { createHeading } from "@webiny/app-page-builder-elements/renderers/heading";
// import { createList } from "@webiny/app-page-builder-elements/renderers/list";
// import { createIcon } from "@webiny/app-page-builder-elements/renderers/icon";
// import { createImage } from "@webiny/app-page-builder-elements/renderers/image";
//
// import { createPagesList } from "@webiny/app-page-builder-elements/renderers/pagesList";
// import { createDefaultDataLoader } from "@webiny/app-page-builder-elements/renderers/pagesList/dataLoaders";
// import { createDefaultPagesListComponent } from "@webiny/app-page-builder-elements/renderers/pagesList/pagesListComponents";
//
// import { createParagraph } from "@webiny/app-page-builder-elements/renderers/paragraph";
// import { createQuote } from "@webiny/app-page-builder-elements/renderers/quote";
//
// import { createTwitter } from "@webiny/app-page-builder-elements/renderers/embeds/twitter";
// import { createPinterest } from "@webiny/app-page-builder-elements/renderers/embeds/pinterest";
// import { createCodesandbox } from "@webiny/app-page-builder-elements/renderers/embeds/codesandbox";
// import { createSoundcloud } from "@webiny/app-page-builder-elements/renderers/embeds/soundcloud";
// import { createYoutube } from "@webiny/app-page-builder-elements/renderers/embeds/youtube";
// import { createVimeo } from "@webiny/app-page-builder-elements/renderers/embeds/vimeo";

// {
//     block: createBlock(),
//         button: createButton({
//     clickHandlers: [
//         {
//             id: "alert1",
//             name: "Alert 1",
//             variables: [
//                 { name: "namer", label: "Namer", defaultValue: "Billy" },
//                 {
//                     name: "namer2",
//                     label: "Namer2",
//                     defaultValue: "Billy2"
//                 }
//             ],
//             handler: (params: any) => {
//                 console.log("variable namer", params["namer"]);
//                 console.log("variable namer2", params["namer2"]);
//             }
//         },
//         {
//             id: "alert2",
//             name: "Alert 2",
//             handler: () => {
//                 alert("dvaaaaa");
//             }
//         }
//     ]
// }),
//     cell: createCell(),
//     document: createDocument(),
//     grid: createGrid(),
//     heading: createHeading(),
//     list: createList(),
//     icon: createIcon(),
//     image: createImage(),
//     paragraph: createParagraph(),
//     quote: createQuote(),
//     twitter: createTwitter(),
//     pinterest: createPinterest(),
//     codesandbox: createCodesandbox(),
//     soundcloud: createSoundcloud(),
//     youtube: createYoutube(),
//     vimeo: createVimeo(),
//     "pages-list": createPagesList({
//     dataLoader: createDefaultDataLoader({
//         apiUrl: process.env.REACT_APP_API_URL + "/graphql",
//         includeHeaders: {
//             "x-tenant": "root"
//         }
//     }),
//     pagesListComponents: {
//         default: createDefaultPagesListComponent(),
//         default2: createDefaultPagesListComponent(),
//         default3: createDefaultPagesListComponent()
//     }
// })
// }

// Attributes modifiers.
import { createId } from "@webiny/app-page-builder-elements/modifiers/attributes/id";
import { createClassName } from "@webiny/app-page-builder-elements/modifiers/attributes/className";
import { createDataElementType } from "@webiny/app-page-builder-elements/modifiers/attributes/dataElementType";

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
import { createWidth } from "@webiny/app-page-builder-elements/modifiers/styles/width";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { Theme } from "@webiny/app-page-builder-theme/types";

import { plugins } from "@webiny/plugins";
import { PbRenderElementPlugin } from "~/types";

export const PageElementsProvider: React.FC = ({ children }) => {
    const pageBuilder = usePageBuilder();

    const renderers = plugins
        .byType<PbRenderElementPlugin>("pb-render-page-element")
        .reduce((current, item) => {
            return { ...current, [item.elementType]: item.renderer };
        }, {});

    const modifiers = {
        attributes: {
            dataElementType: createDataElementType(),
            id: createId(),
            className: createClassName()
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
            width: createWidth()
        }
    };

    return (
        <PbPageElementsProvider
            // We can assign `Theme` here because we know at this point we're using the new elements rendering engine.
            theme={pageBuilder.theme as Theme}
            renderers={renderers}
            modifiers={modifiers}
        >
            {children}
        </PbPageElementsProvider>
    );
};
