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
 * @TODO Create separate component with composition scopes
 * */
export const TypographyDropDown = () => {
    const { value, applyTypography } = useTypographyAction();
    const { theme } = usePageElements();
    const [styles, setStyles] = useState<TypographyStyle[]>([]);
    const { textBlockSelection } = useRichTextEditor();
    const textType = textBlockSelection?.state?.textType;

    useEffect(() => {
        if (textType) {
            switch (textType) {
                case "heading":
                    const headingsStyles = theme.styles.typography?.headings || [];
                    setStyles(headingsStyles);
                    break;
                case "paragraph":
                    const paragraphStyles = theme.styles.typography?.paragraphs || [];
                    setStyles(paragraphStyles);
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
