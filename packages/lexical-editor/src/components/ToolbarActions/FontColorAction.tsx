import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, LexicalCommand } from "lexical";
import { $getSelectionStyleValueForProperty } from "@lexical/selection";
import { Compose, makeComposable } from "@webiny/react-composition";
import { FontColorActionContext } from "~/context/FontColorActionContext";
import { ADD_FONT_COLOR_COMMAND, FontColorPayload } from "~/nodes/FontColorNode";

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
    const [activeEditor, setActiveEditor] = useState(editor);
    const [fontColor, setFontColor] = useState<string>("#000");

    const onFontColorSelect = useCallback((value: string) => {
        editor.dispatchCommand<LexicalCommand<FontColorPayload>>(ADD_FONT_COLOR_COMMAND, {
            color: value
        });
    }, []);

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
