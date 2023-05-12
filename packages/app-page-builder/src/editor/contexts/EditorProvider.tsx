import React from "react";
import { makeComposable } from "@webiny/app-admin";
import { EventActionHandlerProvider } from "./EventActionHandlerProvider";
import { EditorPageElementsProvider } from "~/editor/contexts/EditorPageElementsProvider";
import { isLegacyRenderingEngine } from "~/utils";

export const EditorProvider = makeComposable("EditorProvider", ({ children }) => {
    if (isLegacyRenderingEngine) {
        return <EventActionHandlerProvider>{children}</EventActionHandlerProvider>;
    }

    return (
        <EventActionHandlerProvider>
            <EditorPageElementsProvider>{children}</EditorPageElementsProvider>
        </EventActionHandlerProvider>
    );
});
