import React, { useMemo } from "react";
import { PageElementsProvider as PbPageElementsProvider } from "@webiny/app-page-builder-elements/contexts/PageElements";

// Attributes modifiers.
import { createId } from "@webiny/app-page-builder-elements/modifiers/attributes/id";
import { createClassName } from "@webiny/app-page-builder-elements/modifiers/attributes/className";
import { createAnimation } from "@webiny/app-page-builder-elements/modifiers/attributes/animation";
import { initializeAos } from "@webiny/app-page-builder-elements/modifiers/attributes/animation/initializeAos";

// Styles modifiers.
import { createBackground } from "@webiny/app-page-builder-elements/modifiers/styles/background";
import { createBorder } from "@webiny/app-page-builder-elements/modifiers/styles/border";
import { createGrid } from "@webiny/app-page-builder-elements/modifiers/styles/grid";
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
import { DecoratedTheme } from "@webiny/app-theme/types";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin } from "~/types";
import { ElementControls } from "./EditorPageElementsProvider/ElementControls";
import { mediaToContainer } from "./EditorPageElementsProvider/mediaToContainer";

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
            grid: createGrid(),
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

    // We override all `@media` usages in breakpoints with `@container page-editor-canvas`. This is what
    // enables us responsive design inside the Page Builder's page editor.
    const containerizedTheme = useMemo(() => {
        const theme = pageBuilder.theme as DecoratedTheme;

        return {
            ...pageBuilder.theme,
            breakpoints: Object.keys(theme.breakpoints).reduce((result, breakpointName) => {
                const breakpoint = theme.breakpoints[breakpointName];
                return {
                    ...result,
                    [breakpointName]: mediaToContainer(breakpoint)
                };
            }, {})
        } as DecoratedTheme;
    }, [pageBuilder.theme]);

    return (
        <PbPageElementsProvider
            theme={containerizedTheme}
            renderers={renderers}
            modifiers={modifiers}
            beforeRenderer={ElementControls}
        >
            {children}
        </PbPageElementsProvider>
    );
};
