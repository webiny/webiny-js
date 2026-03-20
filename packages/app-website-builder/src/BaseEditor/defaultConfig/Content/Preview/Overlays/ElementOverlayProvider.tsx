import React from "react";
import { createGenericContext } from "@webiny/app";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { useElementComponentManifest } from "~/BaseEditor/defaultConfig/Content/Preview/useElementComponentManifest.js";
import type { Box } from "../Box.js";

interface ElementOverlayContext {
    elementId: string;
    isSelected: boolean;
    isHighlighted: boolean;
    box: Box;
    componentManifest: ComponentManifest;
}

export type ElementOverlayProviderProps = Pick<
    ElementOverlayContext,
    "elementId" | "isSelected" | "isHighlighted" | "box"
> & {
    children: React.ReactNode;
};

const context = createGenericContext<ElementOverlayContext>("ElementOverlayProvider");

export const ElementOverlayProvider = (props: ElementOverlayProviderProps) => {
    const { children } = props;
    const componentManifest = useElementComponentManifest(props.elementId);

    if (!componentManifest) {
        return null;
    }

    return (
        <context.Provider {...props} componentManifest={componentManifest}>
            {children}
        </context.Provider>
    );
};
export const useElementOverlay = context.useHook;
