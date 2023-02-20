import React from "react";
import { PageElementsProvider as PbPageElementsProvider } from "@webiny/app-page-builder-elements/contexts/PageElements";

// Attributes modifiers.
import { createId } from "@webiny/app-page-builder-elements/modifiers/attributes/id";
import { createClassName } from "@webiny/app-page-builder-elements/modifiers/attributes/className";
import { createAnimation } from "@webiny/app-page-builder-elements/modifiers/attributes/animation";
import { initializeAos } from "@webiny/app-page-builder-elements/modifiers/attributes/animation/initializeAos";

// Styles modifiers.
import { createBackground } from "@webiny/app-page-builder-elements/modifiers/styles/background";
import { createBorder } from "@webiny/app-page-builder-elements/modifiers/styles/border";
import { createGridFlexWrap } from "@webiny/app-page-builder-elements/modifiers/styles/gridFlexWrap";
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

// Additional editor styles modifiers.
import { createAnimationZIndexFix } from "./EditorPageElementsProvider/modifiers/styles/animationZIndexFix";

// Other.
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { Theme } from "@webiny/app-theme/types";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin } from "~/types";

import { ElementControls } from "./EditorPageElementsProvider/ElementControls";

export const EditorPageElementsProvider: React.FC = ({ children }) => {
    const pageBuilder = usePageBuilder();

    const renderers = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .reduce((current, item) => {
            return { ...current, [item.elementType]: item.render };
        }, {});

    const modifiers = {
        attributes: {
            id: createId(),
            className: createClassName(),
            animation: createAnimation({ initializeAos })
        },
        styles: {
            animationZIndexFix: createAnimationZIndexFix(),
            background: createBackground(),
            border: createBorder(),
            gridFlexWrap: createGridFlexWrap(),
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
            beforeRenderer={ElementControls}
        >
            {children}
        </PbPageElementsProvider>
    );
};
