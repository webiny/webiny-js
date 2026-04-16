"use client";
import { createComponent } from "~/createComponent.js";
import { RootComponent } from "./Root.js";

export const Root = createComponent(RootComponent, {
    name: "Webiny/Root",
    label: "Main Content",
    acceptsChildren: true,
    hideFromToolbar: true
});
