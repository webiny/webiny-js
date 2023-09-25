import React, { useEffect, useState } from "react";
import {
    DropDown,
    DropDownItem,
    useRichTextEditor,
    useTypographyAction
} from "@webiny/lexical-editor";
import { TypographyStyle } from "@webiny/theme/types";
import { TypographyValue } from "@webiny/lexical-editor/types";
import { useTheme } from "@webiny/app-admin";
import { useCurrentElement } from "@webiny/lexical-editor/hooks/useCurrentElement";
import { $isHeadingNode } from "@webiny/lexical-editor/nodes/HeadingNode";
import { $isParagraphNode } from "@webiny/lexical-editor/nodes/ParagraphNode";
import { $isQuoteNode } from "@webiny/lexical-editor/nodes/QuoteNode";

/*
 * This components support the typography selection for the Page Builder app.
 * */
export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = useTheme();
    const [styles, setStyles] = useState<TypographyStyle[]>([]);
    const { element } = useCurrentElement();

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
        if (!element) {
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
            // TODO: finish these
            // case "bullet":
            //     setStyles(getListStyles("ul"));
            //     break;
            // case "number":
            //     setStyles(getListStyles("ol"));
            //     break;
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
