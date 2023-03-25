import React, { useEffect, useState } from "react";
import {
    DropDown,
    DropDownItem,
    useRichTextEditor,
    useTypographyAction
} from "@webiny/lexical-editor";
import { usePageElements } from "@webiny/app-page-builder-elements";
import { ThemeTypographyHTMLTag, TypographyStyle } from "@webiny/theme/types";
import { TypographyValue } from "@webiny/lexical-editor/types";

export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = usePageElements();
    const [styles, setStyles] = useState<TypographyStyle<ThemeTypographyHTMLTag>[]>([]);
    const typographyStyles = theme.styles?.typographyStyles;
    const { textBlockSelection } = useRichTextEditor();
    const textBLockType = textBlockSelection?.state?.textBlockType;

    const hasTypographyStyles = (): boolean => {
        return !!typographyStyles;
    };

    useEffect(() => {
        if (textBLockType) {
            switch (textBLockType) {
                case "heading":
                    setStyles(theme.styles?.typographyStyles?.headings || []);
                    break;
                case "paragraph":
                    setStyles(theme.styles?.typographyStyles?.paragraphs || []);
                    break;
                case "bullet":
                    setStyles(
                        theme.styles?.typographyStyles?.lists?.filter(x => x.tag === "ul") || []
                    );
                    break;
                case "number":
                    setStyles(
                        theme.styles?.typographyStyles?.lists?.filter(x => x.tag === "ol") || []
                    );
                    break;
                case "quoteblock":
                    setStyles(theme.styles?.typographyStyles?.quotes || []);
                    break;
                default:
                    setStyles([]);
            }
        }
    }, [textBLockType]);

    return (
        <>
            {theme && hasTypographyStyles() ? (
                <DropDown
                    buttonClassName="toolbar-item typography-dropdown"
                    buttonAriaLabel={"Formatting options for font size"}
                    buttonLabel={value?.name || "Normal"}
                    stopCloseOnClickSelf={true}
                    disabled={false}
                    showScroll={false}
                >
                    {styles?.map(option => (
                        <DropDownItem
                            className={`item typography-item ${
                                value?.id === option.id ? "active dropdown-item-active" : ""
                            }`}
                            onClick={() => applyTypography(option as TypographyValue)}
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
