import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    LexicalEditor,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { DropDown, DropDownItem } from "../../ui/DropDown";


/**
 * Toolbar action. Allow user to change font size for selected text.
 */

const FONT_SIZE_OPTIONS: [string, string][] = [
    ["8px", "8px"],
    ["9px", "9px"],
    ["10px", "10px"],
    ["11px", "11px"],
    ["12px", "12px"],
    ["14px", "14px"],
    ["15px", "15px"],
    ["16px", "16px"],
    ["18px", "18px"],
    ["21px", "21px"],
    ["24px", "24px"],
    ["30px", "30px"],
    ["36px", "36px"],
    ["48px", "48px"],
    ["60px", "60px"],
    ["72px", "72px"],
    ["96px", "96px"]
];

function dropDownActiveClass(active: boolean) {
    if (active) {
        return "active dropdown-item-active";
    }
    return "";
}

interface FontSizeDropDownProps {
    editor: LexicalEditor;
    value: string;
    disabled?: boolean;
}

function FontSizeDropDown(props: FontSizeDropDownProps): JSX.Element {
    const { editor, value, disabled = false } = props;
    const handleClick = useCallback(
        (option: string) => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, {
                        ["font-size"]: option
                    });
                }
            });
        },
        [editor]
    );

    return (
        <DropDown
            disabled={disabled}
            buttonClassName="toolbar-item font-size"
            buttonLabel={value}
            buttonAriaLabel={"Formatting options for font size"}
        >
            {FONT_SIZE_OPTIONS.map(([option, text]) => (
                <DropDownItem
                    className={`item fontsize-item ${dropDownActiveClass(value === option)}`}
                    onClick={() => handleClick(option)}
                    key={option}
                >
                    <span className="text">{text}</span>
                </DropDownItem>
            ))}
        </DropDown>
    );
}

export const FontSizeAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isEditable, setIsEditable] = useState(() => editor.isEditable());
    const [activeEditor, setActiveEditor] = useState(editor);
    const [fontSize, setFontSize] = useState<string>("15px");

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            setFontSize($getSelectionStyleValueForProperty(selection, "font-size", "15px"));
        }
    }, [activeEditor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerEditableListener(editable => {
                setIsEditable(editable);
            }),
            activeEditor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            })
        );
    }, [activeEditor, editor, updateToolbar]);

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
    return (
        <>
            <FontSizeDropDown disabled={!isEditable} value={fontSize} editor={editor} />
        </>
    );
};
