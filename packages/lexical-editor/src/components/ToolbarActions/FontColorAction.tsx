import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";
import {ColorPickerDropdown} from "~/components/ColorPickerDropdown/ColorPickerDropdown";
import {makeComposable} from "@webiny/react-composition";


interface ColorPickerElement {
    onChange: (color: string) => void;
    value: string;
}

interface FontColorAction {
    ColorPickerElement?: JSX.Element;
}

export const FontColorAction = makeComposable<FontColorAction>("FontColorAction",  (colorPickerElement) => {
    const [editor] = useLexicalComposerContext();
    const [activeEditor, setActiveEditor] = useState(editor);
    const [fontColor, setFontColor] = useState<string>("#000");

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
        }
    }, [activeEditor]);

    useEffect(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            setFontColor($getSelectionStyleValueForProperty(selection, "color", "#000"));
        }
    }, [activeEditor]);

    const applyStyleText = useCallback(
        (styles: Record<string, string>) => {
            activeEditor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, styles);
                }
            });
        },
        [activeEditor]
    );

    const onFontColorSelect = useCallback(
        (value: string) => {
            applyStyleText({ color: value });
        },
        [applyStyleText]
    );

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            (_payload, newEditor) => {
                updateToolbar();
                setActiveEditor(newEditor);
                return false;
            },
            COMMAND_PRIORITY_CRITICAL
        );
    }, [editor, updateToolbar]);

    return <ColorPickerDropdown value={fontColor}  onChange={onFontColorSelect} />;
});
