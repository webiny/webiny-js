import React, { useEffect, useState } from "react";
import {
    ElementFormatType,
    FORMAT_ELEMENT_COMMAND,
    INDENT_CONTENT_COMMAND,
    OUTDENT_CONTENT_COMMAND
} from "lexical";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { Compose, makeComposable } from "@webiny/react-composition";
import { TextAlignmentActionContext } from "~/context/TextAlignmentActionContextProps";

/*
 * Base composable action component that is mounted on toolbar action as a placeholder for the custom toolbar action.
 * Note: Toa add custom component access trough @see LexicalEditorConfig API
 * */
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

const TextAlignmentActionDropDown: React.FC<TextAlignmentActionDropdownProps> = ({
    element
}): JSX.Element => {
    return <Compose component={BaseTextAlignmentDropDown} with={() => () => element} />;
};

export interface TextAlignmentAction extends React.FC<unknown> {
    TextAlignmentDropDown: typeof TextAlignmentActionDropDown;
}

export const TextAlignmentAction: TextAlignmentAction = () => {
    const { activeEditor } = useRichTextEditor();
    const [alignmentValue, setAlignmentValue] = useState<ElementFormatType>("");
    const applyTextAlignment = (value: ElementFormatType) => {
        if (activeEditor) {
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
            setAlignmentValue(value);
        }
    };

    const outdentText = () => {
        if (activeEditor) {
            activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        }
    };

    const indentText = () => {
        if (activeEditor) {
            activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }
    };

    return (
        <TextAlignmentActionContext.Provider
            value={{ value: alignmentValue, applyTextAlignment, outdentText, indentText }}
        >
            <BaseTextAlignmentDropDown />
        </TextAlignmentActionContext.Provider>
    );
};

TextAlignmentAction.TextAlignmentDropDown = TextAlignmentActionDropDown;
