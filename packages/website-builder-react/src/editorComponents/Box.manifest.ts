"use client";
import { createComponent } from "~/createComponent.js";
import { BoxComponent } from "./Box.js";

export const Box = createComponent(BoxComponent, {
    name: "Webiny/Box",
    label: "Box",
    aiContext:
        "Generic container with no visual output of its own. Use it to group child elements and apply shared padding, margin, background, or other styles.",
    group: "basic",
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/></svg>`,
    acceptsChildren: true,
    defaults: {
        styles: {
            paddingTop: "5px",
            paddingRight: "5px",
            paddingBottom: "5px",
            paddingLeft: "5px"
        }
    }
});
