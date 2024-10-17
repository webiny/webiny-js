import React from "react";
import { createDecorator } from "@webiny/react-composition";
import { EditorProvider } from "~/editor";
import { TranslationProvider } from "./TranslationContext";

export const AddTranslatableItemsContext = createDecorator(EditorProvider, Original => {
    return function EditorProvider(props) {
        return (
            <TranslationProvider>
                <Original {...props} />
            </TranslationProvider>
        );
    };
});
