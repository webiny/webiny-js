import React from "react";
import { createComponentPlugin } from "@webiny/react-composition";
import { useActiveElementId } from "@webiny/app-page-builder/editor/hooks/useActiveElementId";
import { Element } from "@webiny/app-page-builder-elements/types";
import { PeHeading } from "~/elements/Heading/PeHeading";
import Heading from "@webiny/app-page-builder/editor/plugins/elements/heading/Heading";
import { isLegacyRenderingEngine } from "@webiny/app-page-builder/utils";

export const HeadingPlugin = createComponentPlugin(Heading, Original => {
    return function HeadingPlugin({ element, ...rest }): JSX.Element {
        const [activeElementId] = useActiveElementId();
        const isActive = activeElementId === element.id;
        if (isActive || isLegacyRenderingEngine) {
            return <Original element={element} {...rest} />;
        }
        return <PeHeading element={element as Element} {...rest} />;
    };
});
