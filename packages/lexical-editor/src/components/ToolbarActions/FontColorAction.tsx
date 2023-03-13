import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalCommand } from "lexical";
import { Compose, makeComposable } from "@webiny/react-composition";
import { FontColorActionContext } from "~/context/FontColorActionContext";
import { ADD_FONT_COLOR_COMMAND, FontColorPayload } from "~/nodes/FontColorNode";
import { usePageElements } from "@webiny/app-page-builder-elements";

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
    const { theme } = usePageElements();

    const isThemeColorName = (color: string): boolean => {
        return !!theme?.styles?.colors[color];
    };

    const getThemeColor = (colorValue: string): string => {
        return isThemeColorName(colorValue) ? theme?.styles?.colors[colorValue] : colorValue;
    };

    const onFontColorSelect = useCallback((colorValue: string) => {
        const color = getThemeColor(colorValue);
        const isThemeColor = isThemeColorName(colorValue);
        const themeColorName = isThemeColor ? colorValue : undefined;
        setFontColor(colorValue);
        const payloadData = {
            color,
            themeColorName,
            isThemeColor
        };
        editor.dispatchCommand<LexicalCommand<FontColorPayload>>(
            ADD_FONT_COLOR_COMMAND,
            payloadData
        );
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
