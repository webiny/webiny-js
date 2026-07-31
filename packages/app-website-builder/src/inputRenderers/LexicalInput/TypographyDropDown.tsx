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
import { useWebsiteBuilderTheme } from "~/BaseEditor/components/index.js";
import type { TypographyStyle } from "@webiny/website-builder-sdk/types/WebsiteBuilderTheme.js";

export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = useWebsiteBuilderTheme();
    const [styles, setStyles] = useState<TypographyStyle[]>([]);
    const { element } = useCurrentElement();
    const { rangeSelection } = useCurrentSelection();

    const getAllTextStyles = (): TypographyStyle[] => {
        if (!theme?.typography) {
            return [];
        }
        const headingsStyles = theme.typography?.headings || [];
        const paragraphStyles = theme.typography?.paragraphs || [];
        return [...headingsStyles, ...paragraphStyles];
    };

    useEffect(() => {
        // In static toolbar typography, styles always need to be visible.
        if (theme?.typography) {
            setStyles(getAllTextStyles());
        }
    }, [theme?.typography]);

    const getListStyles = (tag: string): TypographyStyle[] => {
        const listStyles = theme?.typography.lists?.filter(x => x.tag === tag) || [];
        if (listStyles.length > 0) {
            return listStyles;
        }

        const fallbackTag = tag === "ul" ? "ol" : "ul";
        return theme?.typography.lists?.filter(x => x.tag === fallbackTag) || [];
    };

    useEffect(() => {
        if (!element || !rangeSelection) {
            return;
        }

        if ($isParagraphNode(element) || $isHeadingNode(element)) {
            setStyles(getAllTextStyles());
        } else if ($isListNode(element)) {
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
        } else if ($isQuoteNode(element)) {
            setStyles(theme?.typography?.quotes || []);
        } else {
            setStyles([]);
        }
    }, [element]);

    return (
        <>
            {!!styles?.length ? (
                <DropDown
                    buttonClassName="toolbar-item typography-dropdown"
                    buttonAriaLabel={"Typography formatting options"}
                    buttonLabel={value?.label || "Typography"}
                    stopCloseOnClickSelf={true}
                    disabled={false}
                    showScroll={true}
                >
                    {styles?.map(option => (
                        <DropDownItem
                            className={`item typography-item ${
                                value?.id === option.id ? "active dropdown-item-active" : ""
                            }`}
                            onClick={() => applyTypography(option)}
                            key={option.id}
                        >
                            <span className="text">{option.label}</span>
                        </DropDownItem>
                    ))}
                </DropDown>
            ) : null}
        </>
    );
};
