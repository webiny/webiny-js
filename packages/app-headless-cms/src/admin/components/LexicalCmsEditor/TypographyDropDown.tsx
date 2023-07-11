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
/*
 * This components support the typography selection for page builder and HCMS.
 * */
export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = useTheme();
    const [styles, setStyles] = useState<TypographyStyle[]>([]);
    const { textBlockSelection } = useRichTextEditor();
    const textType = textBlockSelection?.state?.textType;

    const getAllTextStyles = (): TypographyStyle[] => {
        if (!theme?.styles.typography) {
            return [];
        }
        const headingsStyles = theme.styles.typography?.headings || [];
        const paragraphStyles = theme.styles.typography?.paragraphs || [];
        return [...headingsStyles, ...paragraphStyles];
    };

    useEffect(() => {
        // In static toolbar typography styles always need to be visible.
        // User from the start can select immediately in witch style he wants to start typing.
        if (theme?.styles) {
            setStyles(getAllTextStyles());
        }
    }, [theme?.styles]);

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
        if (textType) {
            switch (textType) {
                case "heading":
                case "paragraph":
                    setStyles(getAllTextStyles());
                    break;
                case "bullet":
                    setStyles(getListStyles("ul"));
                    break;
                case "number":
                    setStyles(getListStyles("ol"));
                    break;
                case "quoteblock":
                    setStyles(theme?.styles.typography?.quotes || []);
                    break;
                default:
                    setStyles([]);
            }
        }
    }, [textType]);

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
