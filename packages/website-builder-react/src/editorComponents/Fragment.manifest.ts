"use client";
import { createTextInput } from "@webiny/website-builder-sdk";
import { createComponent } from "~/createComponent.js";
import { FragmentComponent } from "./Fragment.js";

export const Fragment = createComponent(FragmentComponent, {
    name: "Webiny/Fragment",
    label: "Fragment",
    useInAiContentGeneration: false,
    group: "basic",
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/></svg>`,
    inputs: [
        createTextInput({
            name: "name",
            label: "Fragment",
            description: "Select fragment to display.",
            renderer: "Webiny/FragmentSelector"
        })
    ]
});
