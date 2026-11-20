"use client";
import { createTextInput, LayoutContentArea } from "@webiny/website-builder-sdk";
import { createComponent } from "~/createComponent.js";
import { MainContentComponent, NamedContentComponent } from "./LayoutContent.js";

const image = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 5v14h18V5H3zm16 12H5V7h14v10zM7 9h10v2H7V9zm0 4h7v2H7v-2z"/></svg>`;

/**
 * The main page content area of a layout. Every layout starts with it, and keeps it: it can be moved and
 * styled, but not deleted, renamed or inserted again.
 */
export const LayoutContent = createComponent(MainContentComponent, {
    name: LayoutContentArea.MAIN_COMPONENT,
    label: "Main content",
    group: "basic",
    hideFromToolbar: true,
    useInAiContentGeneration: false,
    inputs: [],
    image
});

/**
 * A named page content area, inserted in the layout editor (only there). Pages fill each named area in
 * the page editor.
 */
export const NamedContent = createComponent(NamedContentComponent, {
    name: LayoutContentArea.NAMED_COMPONENT,
    label: "Named content",
    group: "basic",
    useInAiContentGeneration: false,
    inputs: [
        createTextInput({
            name: LayoutContentArea.NAME_INPUT,
            label: "Area name",
            // A label for people: pages' content of the area is stored by the area element's id.
            translatable: false,
            description:
                "Shown in the page editor so authors can tell the areas apart. Renaming an area keeps the content pages added to it."
        })
    ],
    image
});
