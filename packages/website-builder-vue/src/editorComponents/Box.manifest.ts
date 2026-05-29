"use client";
import { createComponent } from "~/createComponent.js";
import { BoxComponent } from "./Box.js";

export const Box = createComponent(BoxComponent, {
    name: "Webiny/Box",
    label: "Box",
    group: "basic",
    image: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M120-120v-720h720v720H120Zm80-80h560v-560H200v560Zm0 0v-560 560Z"/></svg>`,
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
