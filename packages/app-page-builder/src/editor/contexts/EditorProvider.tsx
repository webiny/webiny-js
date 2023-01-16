import React from "react";
import { makeComposable } from "@webiny/app-admin";
import { EventActionHandlerProvider } from "./EventActionHandlerProvider";
import { EditorPageElementsProvider } from "~/editor/contexts/EditorPageElementsProvider";

export const EditorProvider = makeComposable("EditorProvider", ({ children }) => {
    return (
        <EventActionHandlerProvider>
            <EditorPageElementsProvider>{children}</EditorPageElementsProvider>
        </EventActionHandlerProvider>
    );
});
