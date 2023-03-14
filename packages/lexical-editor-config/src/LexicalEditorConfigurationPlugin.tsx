import { LexicalEditorConfig } from "@webiny/lexical-editor";
import React from "react";
import { LexicalColorPickerDropdown } from "~/components/LexicalColorPickerDropdown";
import { FontColorAction } from "@webiny/lexical-editor";
import { makeComposable, createComponentPlugin } from "@webiny/react-composition";

const LexicalEditorConfiguration = makeComposable("LexicalEditorConfiguration", () => {
    return (
        <LexicalEditorConfig>
            <FontColorAction.ColorPicker element={<LexicalColorPickerDropdown />} />
        </LexicalEditorConfig>
    );
});

export const LexicalEditorConfigurationPlugin = createComponentPlugin(
    LexicalEditorConfiguration,
    Original => {
        return function LexicalEditorConfigurationPlugin() {
            return <Original />;
        };
    }
);
