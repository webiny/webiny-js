import React, { useCallback } from "react";
import { StyleAccordion } from "./StyleAccordion.js";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement.js";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import { Background } from "./Groups/Background.js";
import { Border } from "./Groups/Border.js";
import { MarginPadding } from "./Groups/MarginPadding.js";
import { VisibilityGroup } from "./Groups/VisibilityGroup.js";
import { useElementComponentManifest } from "~/BaseEditor/defaultConfig/Content/Preview/useElementComponentManifest.js";
import { StyleSettings } from "@webiny/website-builder-sdk";
import { Layout } from "./Groups/Layout.js";

export const StyleProperties = () => {
    const [element] = useActiveElement();
    if (!element) {
        return null;
    }

    return <ElementStyleProperties element={element} />;
};

const defaultHidden: string[] = [];

const ElementStyleProperties = ({ element }: { element: DocumentElement }) => {
    const componentManifest = useElementComponentManifest(element.id);
    const hideStyles = componentManifest?.hideStyleSettings ?? defaultHidden;

    const isHidden = useCallback(
        (name: string) => {
            return hideStyles.includes(name);
        },
        [hideStyles]
    );

    return (
        <StyleAccordion>
            {isHidden(StyleSettings.Layout) ? null : <Layout elementId={element.id} />}
            {isHidden(StyleSettings.MarginPadding) ? null : (
                <MarginPadding elementId={element.id} />
            )}
            {isHidden(StyleSettings.Border) ? null : <Border elementId={element.id} />}
            {isHidden(StyleSettings.Background) ? null : <Background elementId={element.id} />}
            {isHidden(StyleSettings.Visibility) ? null : <VisibilityGroup elementId={element.id} />}
        </StyleAccordion>
    );
};
