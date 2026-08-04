import React from "react";
import { $isParentElementRTL } from "@lexical/selection";
import { Divider, DropDown, DropDownItem, useTextAlignmentAction } from "@webiny/lexical-editor";
import { useDeriveValueFromSelection } from "@webiny/lexical-editor/hooks/useCurrentSelection.js";
import { ReactComponent as AlignLeftIcon } from "@webiny/icons/format_align_left.svg";
import { ReactComponent as AlignCenterIcon } from "@webiny/icons/format_align_center.svg";
import { ReactComponent as AlignRightIcon } from "@webiny/icons/format_align_right.svg";
import { ReactComponent as AlignJustifyIcon } from "@webiny/icons/format_align_justify.svg";
import { ReactComponent as IndentIcon } from "@webiny/icons/format_indent_increase.svg";
import { ReactComponent as OutdentIcon } from "@webiny/icons/format_indent_decrease.svg";

export const TextAlignmentDropdown = () => {
    const { applyTextAlignment, outdentText, indentText, value } = useTextAlignmentAction();

    const isRTL = useDeriveValueFromSelection(({ rangeSelection }) => {
        return rangeSelection ? $isParentElementRTL(rangeSelection) : false;
    });

    // Empty format defaults to left alignment.
    const alignment = value || "left";

    return (
        <DropDown
            buttonLabel="Align"
            buttonIcon={<AlignLeftIcon className="icon" />}
            buttonClassName="toolbar-item spaced alignment"
            buttonAriaLabel="Formatting options for text alignment"
        >
            <DropDownItem
                onClick={() => {
                    applyTextAlignment("left");
                }}
                className="item"
                selected={alignment === "left"}
            >
                <AlignLeftIcon className="icon" />
                <span className="text">Left Align</span>
            </DropDownItem>
            <DropDownItem
                onClick={() => {
                    applyTextAlignment("center");
                }}
                className="item"
                selected={alignment === "center"}
            >
                <AlignCenterIcon className="icon" />
                <span className="text">Center Align</span>
            </DropDownItem>
            <DropDownItem
                onClick={() => {
                    applyTextAlignment("right");
                }}
                className="item"
                selected={alignment === "right"}
            >
                <AlignRightIcon className="icon" />
                <span className="text">Right Align</span>
            </DropDownItem>
            <DropDownItem
                onClick={() => {
                    applyTextAlignment("justify");
                }}
                className="item"
                selected={alignment === "justify"}
            >
                <AlignJustifyIcon className="icon" />
                <span className="text">Justify Align</span>
            </DropDownItem>
            <Divider />
            <DropDownItem
                onClick={() => {
                    outdentText();
                }}
                className="item"
                selected={false}
            >
                {isRTL ? <IndentIcon className="icon" /> : <OutdentIcon className="icon" />}
                <span className="text">Outdent</span>
            </DropDownItem>
            <DropDownItem
                onClick={() => {
                    indentText();
                }}
                className="item"
                selected={false}
            >
                {isRTL ? <OutdentIcon className="icon" /> : <IndentIcon className="icon" />}
                <span className="text">Indent</span>
            </DropDownItem>
        </DropDown>
    );
};
