import React from "react";
import { DropDown, DropDownItem, useTypographyAction } from "@webiny/lexical-editor";
import { usePageElements } from "@webiny/app-page-builder-elements";
import { TypographyValue } from "@webiny/lexical-editor/types";

const TYPOGRAPHY_DISPLAY_NAMES: Record<string, string> = {
    normal: "Normal",
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    heading4: "Heading 4",
    heading5: "Heading 5",
    heading6: "Heading 6",
    paragraph1: "Paragraph 1",
    paragraph2: "Paragraph 2"
};

export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = usePageElements();
    const typographyStyles = theme.styles?.typography;

    const getTypographyDisplayName = (themeTypographyName: string): string => {
        const name = TYPOGRAPHY_DISPLAY_NAMES[themeTypographyName];
        return name ? name : themeTypographyName;
    };

    const hasTypographyStyles = (): boolean => {
        return !!typographyStyles;
    };

    const typographyList = (): TypographyValue[] => {
        const list: TypographyValue[] = [];
        for (const key in typographyStyles) {
            const styleObject = typographyStyles[key];
            // filter only headings and paragraphs
            if (key.includes("heading") || key.includes("paragraph")) {
                const typographyValue = {
                    styleObject,
                    themeTypographyName: key,
                    displayName: getTypographyDisplayName(key)
                };
                list.push(typographyValue);
            }
        }
        return list;
    };

    return (
        <>
            {theme && hasTypographyStyles() ? (
                <DropDown
                    buttonClassName="toolbar-item typography-dropdown"
                    buttonAriaLabel={"Formatting options for font size"}
                    buttonLabel={value?.displayName || "Normal"}
                    stopCloseOnClickSelf={true}
                    disabled={false}
                    showScroll={false}
                >
                    {typographyList().map(option => (
                        <DropDownItem
                            className={`item typography-item ${
                                value?.themeTypographyName === option.themeTypographyName
                                    ? "active dropdown-item-active"
                                    : ""
                            }`}
                            onClick={() => applyTypography(option)}
                            key={option.themeTypographyName}
                        >
                            <span className="text">{option.displayName}</span>
                        </DropDownItem>
                    ))}
                </DropDown>
            ) : null}
        </>
    );
};
