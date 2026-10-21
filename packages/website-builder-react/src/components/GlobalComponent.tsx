"use client";
import React from "react";
import { contentSdk, GlobalElementId } from "@webiny/website-builder-sdk";
import { ElementRenderer } from "./ElementRenderer.js";

export interface GlobalComponentProps {
    // Name of a registered component whose manifest has `global: true`.
    component: string;
}

/**
 * Render the single, site-wide instance of a global component.
 * Use it inside the `layout` of a <DocumentRenderer> to decide where the global appears.
 * The page is delivered with its global components, so the element is read from the page itself.
 */
export const GlobalComponent = ({ component }: GlobalComponentProps) => {
    const registered = contentSdk.getComponent(component);
    if (!registered) {
        throw new Error(
            `<GlobalComponent component="${component}">: the component is not registered. Pass it to <DocumentRenderer components={...}>.`
        );
    }

    if (!registered.manifest.global) {
        throw new Error(
            `<GlobalComponent component="${component}">: the component is not global. Set \`global: true\` in its manifest.`
        );
    }

    return <ElementRenderer id={GlobalElementId.fromName(component).toString()} />;
};
