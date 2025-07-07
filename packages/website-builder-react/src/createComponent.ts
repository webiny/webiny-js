import type { Component, ComponentManifest } from "@webiny/app-website-builder/sdk";
import { createSlotInput } from "@webiny/app-website-builder/sdk";

export const createComponent = (
    component: React.ComponentType<any>,
    manifest: ComponentManifest
): Component => {
    const acceptsChildren = manifest.acceptsChildren;
    if (acceptsChildren) {
        manifest.inputs = [
            ...(manifest.inputs ?? []),
            createSlotInput({
                name: "children",
                defaultValue: []
            })
        ];
    }

    return {
        component,
        manifest
    };
};
