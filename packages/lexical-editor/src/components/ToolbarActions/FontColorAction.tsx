import React, { useCallback, useEffect, useMemo } from "react";
import type { LexicalCommand } from "lexical";
import { Compose, makeDecoratable } from "@webiny/react-composition";
import { FontColorActionContext } from "~/context/FontColorActionContext.js";
import type { FontColorPayload } from "@webiny/lexical-nodes";
import { $isFontColorNode, ADD_FONT_COLOR_COMMAND, ThemeColorValue } from "@webiny/lexical-nodes";
import { getSelectedNode } from "~/utils/getSelectedNode.js";
import { useDeriveValueFromSelection } from "~/hooks/useCurrentSelection.js";
import { useRichTextEditor } from "~/hooks/index.js";

/**
 * Sentinel for "no explicit font colour": the text renders with whatever the editor inherits,
 * which follows the active theme. Reporting `#000` here instead meant the toolbar icon and the
 * picker both assumed black, regardless of the theme.
 */
export const INHERITED_FONT_COLOR = "inherit";

export const FontColorPicker = makeDecoratable("FontColorPicker", (): React.JSX.Element | null => {
    useEffect(() => {
        console.log("Default FontColorPicker, please add your own component");
    }, []);
    return null;
});

interface FontActionColorPicker {
    element: React.JSX.Element;
}

const FontActionColorPicker = ({ element }: FontActionColorPicker): React.JSX.Element => {
    return <Compose component={FontColorPicker} with={() => () => element} />;
};

export type FontColorAction = React.ComponentType<unknown> & {
    ColorPicker: typeof FontActionColorPicker;
};

export const FontColorAction: FontColorAction = () => {
    const { editor } = useRichTextEditor();
    const fontColor = useDeriveValueFromSelection(({ rangeSelection }) => {
        if (!rangeSelection) {
            return INHERITED_FONT_COLOR;
        }

        const node = getSelectedNode(rangeSelection);
        return $isFontColorNode(node) ? node.getColorStyle().color : INHERITED_FONT_COLOR;
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
