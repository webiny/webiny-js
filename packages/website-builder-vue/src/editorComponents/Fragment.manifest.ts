"use client";
import { createTextInput } from "@webiny/website-builder-sdk";
import { createComponent } from "~/createComponent.js";
import { FragmentComponent } from "./Fragment.js";

export const Fragment = createComponent(FragmentComponent, {
    name: "Webiny/Fragment",
    label: "Fragment",
    group: "basic",
    image: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M120-120v-720h720v720H120Zm80-80h560v-560H200v560Zm0 0v-560 560Z"/></svg>`,
    inputs: [
        createTextInput({
            name: "name",
            label: "Fragment",
            description: "Select fragment to display.",
            renderer: "Webiny/FragmentSelector"
        })
    ]
});
