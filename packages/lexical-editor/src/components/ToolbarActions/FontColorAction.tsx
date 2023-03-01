import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";
import { createComponentPlugin, makeComposable } from "@webiny/react-composition";

export interface FontColorPicker {
    value?: string;
    onChange?: (value: string) => void;
}

/*
 * Composable Color Picker component that is mounted on toolbar action.
 * Note: Toa add custom component access trough @see LexicalEditorConfig API
 * */
export const FontColorPicker = makeComposable<FontColorPicker>(
    "FontColorPicker",
    (): JSX.Element | null => {
        useEffect(() => {
            console.log("Default FontColorPicker, please add your own component");
        }, []);
        return null;
    }
);

interface FontActionColorPicker {
    Element: typeof FontColorPicker;
}

const FontActionColorPicker: React.FC<FontActionColorPicker> = ({ Element }): JSX.Element => {
    const FontColorPickerPlugin = createComponentPlugin(FontColorPicker, () => {
        return function FontColorPickerPlugin({ value, onChange }): JSX.Element {
            return <Element value={value} onChange={onChange} />;
        };
    });
    return <FontColorPickerPlugin />;
};

export interface FontColorAction extends React.FC<unknown> {
    ColorPicker: typeof FontActionColorPicker;
}

export const FontColorAction: FontColorAction = () => {
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

    return <FontColorPicker value={fontColor} onChange={onFontColorSelect} />;
};

{
    /* Color action settings */
}
FontColorAction.ColorPicker = FontActionColorPicker;
