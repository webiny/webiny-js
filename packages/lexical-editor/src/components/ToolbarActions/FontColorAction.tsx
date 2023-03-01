import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";
import { DropDown } from "~/ui/DropDown";
import { makeComposable } from "@webiny/react-composition";
import { ColorPicker } from "@webiny/ui/ColorPicker";

interface FontColorPicker {
    onChange: (value: string) => void;
}

export const FontColorPicker = makeComposable(
    "FontColorPicker",
    ({ onChange }: FontColorPicker): JSX.Element => {
        return (
            <DropDown
                buttonClassName="toolbar-item font-color"
                buttonLabel={"value"}
                buttonAriaLabel={"Formatting options for font size"}
            >
                <div className="color-picker-wrapper" style={{ width: "auto" }}>
                    <ColorPicker onChange={onChange} />
                    Some color picker thing
                </div>
            </DropDown>
        );
    }
);

export const FontColorAction = () => {
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
            setFontColor($getSelectionStyleValueForProperty(selection, "color", fontColor));
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

    return <FontColorPicker onChange={onFontColorSelect} />;
};
