import React from "react";
import { PageElementsProvider as PbPageElementsProvider } from "@webiny/app-page-builder-elements/contexts/PageElements";

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
import { createVisibility } from "@webiny/app-page-builder-elements/modifiers/styles/visibility";
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
            visibility: createVisibility(),
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
