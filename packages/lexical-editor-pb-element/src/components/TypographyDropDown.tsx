import React, { useEffect, useState } from "react";
import { $getNearestNodeOfType } from "@lexical/utils";
import {
    DropDown,
    DropDownItem,
    useCurrentSelection,
    useTypographyAction
} from "@webiny/lexical-editor";
import { TypographyStyle } from "@webiny/theme/types";
import { TypographyValue } from "@webiny/lexical-editor/types";
import { useTheme } from "@webiny/app-admin";
import { useCurrentElement } from "@webiny/lexical-editor/hooks/useCurrentElement";
import { $isHeadingNode } from "@webiny/lexical-editor/nodes/HeadingNode";
import { $isParagraphNode } from "@webiny/lexical-editor/nodes/ParagraphNode";
import { $isQuoteNode } from "@webiny/lexical-editor/nodes/QuoteNode";
import { $isListNode, ListNode } from "@webiny/lexical-editor/nodes/ListNode";

/*
 * This components support the typography selection for the Page Builder app.
 * */
export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = useTheme();
    const [styles, setStyles] = useState<TypographyStyle[]>([]);
    const { element } = useCurrentElement();
    const { rangeSelection } = useCurrentSelection();

    const getListStyles = (tag: string): TypographyStyle[] => {
        const listStyles = theme?.styles.typography.lists?.filter(x => x.tag === tag) || [];
        if (listStyles.length > 0) {
            return listStyles;
        }
        // fallback
        const fallbackTag = tag === "ul" ? "ol" : "ul";
        return theme?.styles.typography.lists?.filter(x => x.tag === fallbackTag) || [];
    };

    useEffect(() => {
        if (!element || !rangeSelection) {
            return;
        }

        switch (true) {
            case $isHeadingNode(element):
                const headingsStyles = theme?.styles.typography?.headings || [];
                setStyles(headingsStyles);
                break;
            case $isParagraphNode(element):
                const paragraphStyles = theme?.styles.typography?.paragraphs || [];
                setStyles(paragraphStyles);
                break;
            case $isListNode(element):
                let type;
                try {
                    const anchorNode = rangeSelection.anchor.getNode();
                    const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
                    if (parentList) {
                        type = parentList.getListType();
                    }
                } catch {
                    type = element.getListType();
                }

                if (type === "bullet") {
                    setStyles(getListStyles("ul"));
                } else {
                    setStyles(getListStyles("ol"));
                }
                break;
            case $isQuoteNode(element):
                setStyles(theme?.styles.typography?.quotes || []);
                break;
            default:
                setStyles([]);
        }
    }, [element]);

    return (
        <>
            {!!styles?.length ? (
                <DropDown
                    buttonClassName="toolbar-item typography-dropdown"
                    buttonAriaLabel={"Typography formatting options"}
                    buttonLabel={value?.name || "Typography"}
                    stopCloseOnClickSelf={true}
                    disabled={false}
                    showScroll={false}
                >
                    {styles?.map(option => (
                        <DropDownItem
                            className={`item typography-item ${
                                value?.id === option.id ? "active dropdown-item-active" : ""
                            }`}
                            onClick={() =>
                                applyTypography({
                                    ...option,
                                    css: option.styles
                                } as TypographyValue)
                            }
                            key={option.id}
                        >
                            <span className="text">{option.name}</span>
                        </DropDownItem>
                    ))}
                </DropDown>
            ) : null}
        </>
    );
};
