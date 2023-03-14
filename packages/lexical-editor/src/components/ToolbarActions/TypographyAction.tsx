import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, LexicalCommand } from "lexical";
import { Compose, makeComposable } from "@webiny/react-composition";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { TypographyActionContext, TypographyValue } from "~/context/TypographyActionContext";
import {
    $isTypographyNode,
    ADD_TYPOGRAPHY_COMMAND,
    TypographyPayload
} from "~/nodes/TypographyNode";

/*
 * Base composable action component that is mounted on toolbar action as a placeholder for the custom toolbar action.
 * Note: Toa add custom component access trough @see LexicalEditorConfig API
 * */
export const BaseTypographyActionDropDown = makeComposable(
    "BaseTypographyActionDropDown",
    (): JSX.Element | null => {
        useEffect(() => {
            console.log("Default BaseTypographyActionDropDown, please add your own component");
        }, []);
        return null;
    }
);

interface TypographyActionDropdownProps {
    element: JSX.Element;
}

const TypographyActionDropDown: React.FC<TypographyActionDropdownProps> = ({
    element
}): JSX.Element => {
    return <Compose component={BaseTypographyActionDropDown} with={() => () => element} />;
};

export interface TypographyAction extends React.FC<unknown> {
    TypographyDropDown: typeof TypographyActionDropDown;
}

export const TypographyAction: TypographyAction = () => {
    const [editor] = useLexicalComposerContext();
    const [typography, setTypography] = useState<TypographyValue>();

    const setTypographySelect = useCallback(
        (value: TypographyValue) => {
            setTypography(value);
        },
        [typography]
    );

    const onTypographySelect = useCallback((value: TypographyValue) => {
        console.log("Value", value);
        setTypographySelect(value);
        editor.dispatchCommand<LexicalCommand<TypographyPayload>>(ADD_TYPOGRAPHY_COMMAND, {
            value
        });
    }, []);

    /*const updatePopup = useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return;
            }
            const node = getSelectedNode(selection);
            if ($isTypographyNode(node)) {
                // const colorStyle = node.getColorStyle();
               // setFontColor(colorStyle.color);
                console.log("$isTypographyNode", node.getTypographyValue())
            }
        });
    }, [editor]);

    useEffect(() => {
        document.addEventListener("selectionchange", updatePopup);
        return () => {
            document.removeEventListener("selectionchange", updatePopup);
        };
    }, [updatePopup])*/

    return (
        <TypographyActionContext.Provider
            value={{
                value: typography,
                applyTypography: onTypographySelect
            }}
        >
            <BaseTypographyActionDropDown />
        </TypographyActionContext.Provider>
    );
};

{
    /* Color action settings */
}
TypographyAction.TypographyDropDown = TypographyActionDropDown;
