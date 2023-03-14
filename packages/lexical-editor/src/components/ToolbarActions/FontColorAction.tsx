import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, LexicalCommand } from "lexical";
import { Compose, makeComposable } from "@webiny/react-composition";
import { FontColorActionContext } from "~/context/FontColorActionContext";
import { $isFontColorNode, ADD_FONT_COLOR_COMMAND, FontColorPayload } from "~/nodes/FontColorNode";
import { getSelectedNode } from "~/utils/getSelectedNode";

/*
 * Composable Color Picker component that is mounted on toolbar action.
 * Note: Toa add custom component access trough @see LexicalEditorConfig API
 * */
export const FontColorPicker = makeComposable("FontColorPicker", (): JSX.Element | null => {
    useEffect(() => {
        console.log("Default FontColorPicker, please add your own component");
    }, []);
    return null;
});

interface FontActionColorPicker {
    element: JSX.Element;
}

const FontActionColorPicker: React.FC<FontActionColorPicker> = ({ element }): JSX.Element => {
    return <Compose component={FontColorPicker} with={() => () => element} />;
};

export interface FontColorAction extends React.FC<unknown> {
    ColorPicker: typeof FontActionColorPicker;
}

export const FontColorAction: FontColorAction = () => {
    const [editor] = useLexicalComposerContext();
    const [fontColor, setFontColor] = useState<string>("#000");

    const setFontColorSelect = useCallback(
        (fontColorValue: string) => {
            setFontColor(fontColorValue);
        },
        [fontColor]
    );

    const onFontColorSelect = useCallback(
        (colorValue: string, themeColorName: string | undefined) => {
            setFontColorSelect(colorValue);
            editor.dispatchCommand<LexicalCommand<FontColorPayload>>(ADD_FONT_COLOR_COMMAND, {
                color: colorValue,
                themeColorName
            });
        },
        []
    );

    const updatePopup = useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return;
            }
            const node = getSelectedNode(selection);
            if ($isFontColorNode(node)) {
                debugger;
                const colorStyle = node.getColorStyle();
                setFontColor(colorStyle.color);
            }
        });
    }, [editor]);

    useEffect(() => {
        document.addEventListener("selectionchange", updatePopup);
        return () => {
            document.removeEventListener("selectionchange", updatePopup);
        };
    }, [updatePopup]);

    return (
        <FontColorActionContext.Provider
            value={{
                value: fontColor,
                applyColor: onFontColorSelect
            }}
        >
            <FontColorPicker />
        </FontColorActionContext.Provider>
    );
};

{
    /* Color action settings */
}
FontColorAction.ColorPicker = FontActionColorPicker;
