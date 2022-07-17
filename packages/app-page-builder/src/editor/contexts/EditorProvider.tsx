import React from "react";
import { makeComposable } from "@webiny/app-admin";
import { EventActionHandlerProvider } from "./EventActionHandlerProvider";

export const EditorProvider = makeComposable("EditorProvider", ({ children }) => {
    return <EventActionHandlerProvider>{children}</EventActionHandlerProvider>;
});
