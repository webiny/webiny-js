import React from "react";
import {
    DropDown,
    DropDownItem,
    useRichTextEditor,
    useTypographyAction
} from "@webiny/lexical-editor";
import { usePageElements } from "@webiny/app-page-builder-elements";
import { ThemeTypographyHTMLTag, TypographyStyle } from "@webiny/theme/types";

export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = usePageElements();
    const typographyStyles = theme.styles?.typography;
    const { toolbarType } = useRichTextEditor();

    const hasTypographyStyles = (): boolean => {
        return !!typographyStyles;
    };

    const getTypographyStyles = (): TypographyStyle<ThemeTypographyHTMLTag>[] => {
        if (toolbarType === "heading") {
            return theme.styles?.typographyStyles?.headings || [];
        }

        if (toolbarType === "paragraph") {
            return theme.styles?.typographyStyles?.paragraphs || [];
        }
        return [];
    };

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
                    {getTypographyStyles()?.map(option => (
                        <DropDownItem
                            className={`item typography-item ${
                                value?.id === option.id ? "active dropdown-item-active" : ""
                            }`}
                            onClick={() => applyTypography(option)}
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
