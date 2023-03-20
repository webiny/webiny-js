import React from "react";
import {
    DropDown,
    DropDownItem,
    getTypographyMetaByName,
    useTypographyAction
} from "@webiny/lexical-editor";
import { usePageElements } from "@webiny/app-page-builder-elements";
import { TypographyHTMLTag } from "@webiny/lexical-editor/types";

type TypographyDropDownItem = {
    styleObject: Record<string, any>;
    themeTypographyName: string;
    htmlTag: TypographyHTMLTag;
    displayName: string;
};

export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = usePageElements();
    const typographyStyles = theme.styles?.typography;

    const hasTypographyStyles = (): boolean => {
        return !!typographyStyles;
    };

    const typographyList = (): TypographyDropDownItem[] => {
        const list: TypographyDropDownItem[] = [];
        for (const key in typographyStyles) {
            const styleObject = typographyStyles[key];
            const metadata = getTypographyMetaByName(key);
            // filter only headings and paragraphs
            if (key.includes("heading") || key.includes("paragraph")) {
                list.push({
                    styleObject,
                    themeTypographyName: key,
                    htmlTag: metadata.htmlTag,
                    displayName: metadata.displayName
                });
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
                    buttonLabel={
                        getTypographyMetaByName(value?.themeTypographyName || "normal").displayName
                    }
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
                            onClick={() =>
                                applyTypography({
                                    styleObject: option.styleObject,
                                    themeTypographyName: option.themeTypographyName,
                                    htmlTag: option.htmlTag
                                })
                            }
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
