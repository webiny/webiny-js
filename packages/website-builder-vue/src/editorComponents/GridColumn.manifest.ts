"use client";
import { StyleSettings } from "@webiny/website-builder-sdk";
import { createComponent } from "~/createComponent.js";
import { GridColumnComponent } from "./GridColumn.js";

export const GridColumn = createComponent(GridColumnComponent, {
    name: "Webiny/GridColumn",
    label: "Column",
    image: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M600-120q-33 0-56.5-23.5T520-200v-560q0-33 23.5-56.5T600-840h160q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H600Zm0-640v560h160v-560H600ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h160q33 0 56.5 23.5T440-760v560q0 33-23.5 56.5T360-120H200Zm0-640v560h160v-560H200Zm560 0H600h160Zm-400 0H200h160Z"/></svg>`,
    canDrag: false,
    canDelete: false,
    acceptsChildren: true,
    hideFromToolbar: true,
    hideStyleSettings: [StyleSettings.Visibility],
    defaults: {
        styles: {
            paddingTop: "10px",
            paddingRight: "10px",
            paddingBottom: "10px",
            paddingLeft: "10px"
        }
    }
});
