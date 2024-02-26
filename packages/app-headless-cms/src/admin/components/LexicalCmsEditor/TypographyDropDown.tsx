import React, { useEffect, useState } from "react";
import { $getNearestNodeOfType } from "@lexical/utils";
import {
    DropDown,
    DropDownItem,
    useCurrentSelection,
    useCurrentElement,
    useTypographyAction
} from "@webiny/lexical-editor";
import {
    $isHeadingNode,
    $isParagraphNode,
    $isQuoteNode,
    $isListNode,
    ListNode
} from "@webiny/lexical-nodes";
import { TypographyStyle } from "@webiny/theme/types";
import { TypographyValue } from "@webiny/lexical-theme";
import { useTheme } from "@webiny/app-admin";

export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = useTheme();
    const [styles, setStyles] = useState<TypographyStyle[]>([]);
    const { element } = useCurrentElement();
    const { rangeSelection } = useCurrentSelection();

    const getAllTextStyles = (): TypographyStyle[] => {
        if (!theme?.styles.typography) {
            return [];
        }
        const headingsStyles = theme.styles.typography?.headings || [];
        const paragraphStyles = theme.styles.typography?.paragraphs || [];
        return [...headingsStyles, ...paragraphStyles];
    };

    useEffect(() => {
        // In static toolbar typography, styles always need to be visible.
        if (theme?.styles) {
            setStyles(getAllTextStyles());
        }
    }, [theme?.styles]);

    const getListStyles = (tag: string): TypographyStyle[] => {
        const listStyles = theme?.styles.typography.lists?.filter(x => x.tag === tag) || [];
        if (listStyles.length > 0) {
            return listStyles;
        }

        const fallbackTag = tag === "ul" ? "ol" : "ul";
        return theme?.styles.typography.lists?.filter(x => x.tag === fallbackTag) || [];
    };

    useEffect(() => {
        if (!element || !rangeSelection) {
            return;
        }

        switch (true) {
            case $isHeadingNode(element):
            case $isParagraphNode(element):
                setStyles(getAllTextStyles());
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
                    showScroll={true}
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
