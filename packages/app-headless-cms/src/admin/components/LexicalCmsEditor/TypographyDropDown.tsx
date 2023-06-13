import React, { useEffect, useState } from "react";
import {
    DropDown,
    DropDownItem,
    useRichTextEditor,
    useTypographyAction
} from "@webiny/lexical-editor";
import { usePageElements } from "@webiny/app-page-builder-elements";
import { TypographyStyle } from "@webiny/theme/types";
import { TypographyValue } from "@webiny/lexical-editor/types";

/*
 * This components support the typography selection for page builder and HCMS.
 * */
export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = usePageElements();
    const [styles, setStyles] = useState<TypographyStyle[]>([]);
    const { textBlockSelection } = useRichTextEditor();
    const textType = textBlockSelection?.state?.textType;

    const getAllTextStyles = (): TypographyStyle[] => {
        if (!theme.styles.typography) {
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

    useEffect(() => {
        if (textType) {
            switch (textType) {
                case "heading":
                case "paragraph":
                    setStyles(getAllTextStyles());
                    break;
                case "bullet":
                    setStyles(theme.styles.typography.lists?.filter(x => x.tag === "ul") || []);
                    break;
                case "number":
                    setStyles(theme.styles.typography?.lists?.filter(x => x.tag === "ol") || []);
                    break;
                case "quoteblock":
                    setStyles(theme.styles.typography?.quotes || []);
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
