import React, { useCallback, useMemo } from "react";
import { $getSelection, $isRangeSelection } from "lexical";
import { $patchStyleText } from "@lexical/selection";
import { $getSelectionStyleValueForProperty } from "@lexical/selection";
import { useDeriveValueFromSelection } from "~/hooks/useCurrentSelection.js";
import { useRichTextEditor } from "~/hooks/index.js";
import { DropDown } from "~/ui/DropDown.js";
import { DropDownItem } from "~/ui/DropDown.js";

interface FontSizeDropdownProps {
    sizes: string[];
}

const FontSizeDropdown = ({ sizes }: FontSizeDropdownProps) => {
    const { editor } = useRichTextEditor();

    const fontSizeOptions = useMemo(() => {
        return [
            {
                value: "inherit",
                label: "Auto"
            },
            ...sizes.map(size => {
                return {
                    value: size,
                    label: `${size}`
                };
            })
        ];
    }, [sizes]);

    const selectedFontSize = useDeriveValueFromSelection(({ rangeSelection }) => {
        if (!rangeSelection) {
            return "inherit";
        }
        return $getSelectionStyleValueForProperty(rangeSelection, "font-size", "inherit");
    });

    const onFontSizeSelect = useCallback(
        (size: string) => {
            editor.update(() => {
                if (editor.isEditable()) {
                    const selection = $getSelection();
                    if (selection === null) {
                        return;
                    }

                    if ($isRangeSelection(selection) && selection.isCollapsed()) {
                        const anchor = selection.anchor.getNode();
                        const topElement = anchor.getTopLevelElementOrThrow();
                        topElement.select(0, topElement.getChildrenSize());
                        const expanded = $getSelection();
                        if (expanded !== null) {
                            $patchStyleText(expanded, { "font-size": size });
                        }
                    } else {
                        $patchStyleText(selection, { "font-size": size });
                    }
                }
            });
        },
        [editor]
    );

    const selectedOption = fontSizeOptions.find(option => option.value === selectedFontSize);

    return (
        <DropDown
            buttonClassName="toolbar-item typography-dropdown"
            buttonAriaLabel={"Typography formatting options"}
            buttonLabel={selectedOption?.label || "Auto"}
            stopCloseOnClickSelf={true}
            disabled={false}
            showScroll={true}
        >
            {fontSizeOptions.map(option => (
                <DropDownItem
                    className={`item typography-item ${
                        selectedFontSize === option.value ? "active dropdown-item-active" : ""
                    }`}
                    onClick={() => onFontSizeSelect(option.value)}
                    key={option.value}
                >
                    <span className="text">{option.label}</span>
                </DropDownItem>
            ))}
        </DropDown>
    );
};

export const FontSizeAction = () => {
    const { theme } = useRichTextEditor();

    if (!theme.fontSizes || theme.fontSizes.length === 0) {
        return null;
    }

    return <FontSizeDropdown sizes={theme.fontSizes} />;
};
