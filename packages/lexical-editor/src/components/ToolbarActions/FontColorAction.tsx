import React, { useCallback, useEffect, useMemo } from "react";
import { LexicalCommand } from "lexical";
import { Compose, makeDecoratable } from "@webiny/react-composition";
import { FontColorActionContext } from "~/context/FontColorActionContext";
import {
    $isFontColorNode,
    ADD_FONT_COLOR_COMMAND,
    FontColorPayload,
    ThemeColorValue
} from "@webiny/lexical-nodes";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { useDeriveValueFromSelection } from "~/hooks/useCurrentSelection";
import { useRichTextEditor } from "~/hooks";

export const FontColorPicker = makeDecoratable("FontColorPicker", (): JSX.Element | null => {
    useEffect(() => {
        console.log("Default FontColorPicker, please add your own component");
    }, []);
    return null;
});

interface FontActionColorPicker {
    element: JSX.Element;
}

const FontActionColorPicker = ({ element }: FontActionColorPicker): JSX.Element => {
    return <Compose component={FontColorPicker} with={() => () => element} />;
};

export type FontColorAction = React.ComponentType<unknown> & {
    ColorPicker: typeof FontActionColorPicker;
};

export const FontColorAction: FontColorAction = () => {
    const { editor } = useRichTextEditor();
    const fontColor = useDeriveValueFromSelection(({ rangeSelection }) => {
        if (!rangeSelection) {
            return "#000";
        }

        const node = getSelectedNode(rangeSelection);
        return $isFontColorNode(node) ? node.getColorStyle().color : "#000";
    });

    const onFontColorSelect = useCallback(
        (colorValue: string, themeColorName: string | undefined) => {
            editor.dispatchCommand<LexicalCommand<FontColorPayload>>(ADD_FONT_COLOR_COMMAND, {
                color: new ThemeColorValue(colorValue, themeColorName)
            });
        },
        []
    );

    const context = useMemo(
        () => ({
            value: fontColor,
            applyColor: onFontColorSelect
        }),
        [onFontColorSelect, fontColor]
    );

    return (
        <FontColorActionContext.Provider value={context}>
            <FontColorPicker />
        </FontColorActionContext.Provider>
    );
};

FontColorAction.ColorPicker = FontActionColorPicker;
