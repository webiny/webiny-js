import React from "react";
import {
    Divider,
    DropDown,
    DropDownItem,
    useRichTextEditor,
    useTextAlignmentAction
} from "@webiny/lexical-editor";

export const TextAlignmentDropdown = () => {
    const { textBlockSelection } = useRichTextEditor();
    const { applyTextAlignment, outdentText, indentText } = useTextAlignmentAction();

    return (
        <DropDown
            buttonLabel="Align"
            buttonIconClassName="icon left-align"
            buttonClassName="toolbar-item spaced alignment"
            buttonAriaLabel="Formatting options for text alignment"
        >
            <DropDownItem
                onClick={() => {
                    applyTextAlignment("left");
                }}
                className="item"
            >
                <i className="icon left-align" />
                <span className="text">Left Align</span>
            </DropDownItem>
            <DropDownItem
                onClick={() => {
                    applyTextAlignment("center");
                }}
                className="item"
            >
                <i className="icon center-align" />
                <span className="text">Center Align</span>
            </DropDownItem>
            <DropDownItem
                onClick={() => {
                    applyTextAlignment("right");
                }}
                className="item"
            >
                <i className="icon right-align" />
                <span className="text">Right Align</span>
            </DropDownItem>
            <DropDownItem
                onClick={() => {
                    applyTextAlignment("justify");
                }}
                className="item"
            >
                <i className="icon justify-align" />
                <span className="text">Justify Align</span>
            </DropDownItem>
            <Divider />
            <DropDownItem
                onClick={() => {
                    outdentText();
                }}
                className="item"
            >
                <i
                    className={"icon " + (textBlockSelection?.state?.isRTL ? "indent" : "outdent")}
                />
                <span className="text">Outdent</span>
            </DropDownItem>
            <DropDownItem
                onClick={() => {
                    indentText();
                }}
                className="item"
            >
                <i
                    className={"icon " + (textBlockSelection?.state?.isRTL ? "outdent" : "indent")}
                />
                <span className="text">Indent</span>
            </DropDownItem>
        </DropDown>
    );
};
