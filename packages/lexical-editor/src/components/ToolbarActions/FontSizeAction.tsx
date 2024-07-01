import React, { useCallback, useEffect, useState } from "react";
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import { DropDown, DropDownItem } from "~/ui/DropDown";
import { useDeriveValueFromSelection } from "~/hooks/useCurrentSelection";
import { useRichTextEditor } from "~/hooks";

const FONT_SIZE_OPTIONS: string[] = [
    "8px",
    "9px",
    "10px",
    "11px",
    "12px",
    "14px",
    "15px",
    "16px",
    "18px",
    "21px",
    "24px",
    "30px",
    "36px",
    "48px",
    "60px",
    "72px",
    "96px"
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
            {FONT_SIZE_OPTIONS.map(option => (
                <DropDownItem
                    className={`item fontsize-item ${dropDownActiveClass(value === option)}`}
                    onClick={() => handleClick(option)}
                    key={option}
                >
                    <span className="text">{option}</span>
                </DropDownItem>
            ))}
        </DropDown>
    );
}

const defaultSize = "15px";

export const FontSizeAction = () => {
    const { editor } = useRichTextEditor();
    const [isEditable, setIsEditable] = useState(() => editor.isEditable());
    const fontSize = useDeriveValueFromSelection(({ rangeSelection }) => {
        if (!rangeSelection) {
            return defaultSize;
        }
        try {
            return $getSelectionStyleValueForProperty(rangeSelection, "font-size", "15px");
        } catch {
            return defaultSize;
        }
    });

    useEffect(() => {
        return mergeRegister(
            editor.registerEditableListener(editable => {
                setIsEditable(editable);
            })
        );
    }, [editor]);

    return (
        <>
            <FontSizeDropDown disabled={!isEditable} value={fontSize} editor={editor} />
        </>
    );
};
