"use client";
import { createComponent } from "~/createComponent";
import { RootComponent } from "./Root";

export const Root = createComponent(RootComponent, {
    name: "Webiny/Root",
    label: "Main Content",
    acceptsChildren: true,
    hideFromToolbar: true
});
