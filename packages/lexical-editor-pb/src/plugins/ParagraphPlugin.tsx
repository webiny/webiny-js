import React from "react";
import { createComponentPlugin } from "@webiny/react-composition";
import { useActiveElementId } from "@webiny/app-page-builder/editor/hooks/useActiveElementId";
import { Element } from "@webiny/app-page-builder-elements/types";
import { isLegacyRenderingEngine } from "@webiny/app-page-builder/utils";
import Paragraph from "@webiny/app-page-builder/editor/plugins/elements/paragraph/Paragraph";
import { RenderPeText } from "~/components/RenderPeText";

export const ParagraphPlugin = createComponentPlugin(Paragraph, Original => {
    return function HeadingPlugin({ element, ...rest }): JSX.Element {
        const [activeElementId] = useActiveElementId();
        const isActive = activeElementId === element.id;
        if (isActive || isLegacyRenderingEngine) {
            return <Original element={element} {...rest} />;
        }
        return <RenderPeText element={element as Element} {...rest} />;
    };
});
