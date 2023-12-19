import React, { useEffect, useMemo } from "react";
import {
    ElementFormatType,
    FORMAT_ELEMENT_COMMAND,
    INDENT_CONTENT_COMMAND,
    OUTDENT_CONTENT_COMMAND
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Compose, makeComposable } from "@webiny/react-composition";
import { TextAlignmentActionContext } from "~/context/TextAlignmentActionContextProps";
import { useDeriveValueFromSelection } from "~/hooks/useCurrentSelection";
import { getSelectedNode } from "~/utils/getSelectedNode";

/*
 * Base text alignment dropdown composable component.
 * Note: To add a custom dropdown component use @see LexicalEditorConfig API.
 */
export const BaseTextAlignmentDropDown = makeComposable(
    "BaseTextAlignmentDropDown",
    (): JSX.Element | null => {
        useEffect(() => {
            console.log("Default BaseTextAlignmentDropDown, please add your own component");
        }, []);
        return null;
    }
);

interface TextAlignmentActionDropdownProps {
    element: JSX.Element;
}

const TextAlignmentActionDropDown = ({
    element
}: TextAlignmentActionDropdownProps): JSX.Element => {
    return <Compose component={BaseTextAlignmentDropDown} with={() => () => element} />;
};

export type TextAlignmentAction = React.ComponentType<unknown> & {
    TextAlignmentDropDown: typeof TextAlignmentActionDropDown;
};

export const TextAlignmentAction: TextAlignmentAction = () => {
    const [editor] = useLexicalComposerContext();
    const alignmentValue: ElementFormatType = useDeriveValueFromSelection(({ rangeSelection }) => {
        const node = rangeSelection ? getSelectedNode(rangeSelection) : null;
        if (node) {
            return node.getParent()?.getFormatType() || "";
        }
        return "";
    });

    const applyTextAlignment = (value: ElementFormatType) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
    };

    const outdentText = () => {
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
    };

    const indentText = () => {
        editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
    };

    const context = useMemo(
        () => ({
            value: alignmentValue,
            applyTextAlignment,
            outdentText,
            indentText
        }),
        [alignmentValue]
    );

    return (
        <TextAlignmentActionContext.Provider value={context}>
            <BaseTextAlignmentDropDown />
        </TextAlignmentActionContext.Provider>
    );
};

TextAlignmentAction.TextAlignmentDropDown = TextAlignmentActionDropDown;
