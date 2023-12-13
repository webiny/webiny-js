import React, { useCallback, useEffect, useState } from "react";
import { LexicalCommand } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Compose, makeComposable } from "@webiny/react-composition";
import { TypographyValue } from "@webiny/lexical-theme";
import { TypographyActionContext } from "~/context/TypographyActionContext";
import {
    $isHeadingNode,
    $isParagraphNode,
    $isQuoteNode,
    $isTypographyNode,
    ADD_TYPOGRAPHY_COMMAND,
    TypographyNode,
    TypographyPayload
} from "@webiny/lexical-nodes";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    INSERT_QUOTE_COMMAND,
    ListCommandPayload,
    QuoteCommandPayload
} from "~/commands";
import { useCurrentElement } from "~/hooks/useCurrentElement";

/*
 * Base composable action component that is mounted on toolbar action as a placeholder for the custom toolbar action.
 * Note: Toa add custom component access trough @see LexicalEditorConfig API
 * */
export const BaseTypographyActionDropDown = makeComposable(
    "BaseTypographyActionDropDown",
    (): JSX.Element | null => {
        useEffect(() => {
            console.log("Default BaseTypographyActionDropDown, please add your own component");
        }, []);
        return null;
    }
);

interface TypographyActionDropdownProps {
    element: JSX.Element;
}

const TypographyActionDropDown = ({ element }: TypographyActionDropdownProps): JSX.Element => {
    return <Compose component={BaseTypographyActionDropDown} with={() => () => element} />;
};

export type TypographyAction = React.ComponentType<unknown> & {
    TypographyDropDown: typeof TypographyActionDropDown;
};

export const TypographyAction: TypographyAction = () => {
    const [editor] = useLexicalComposerContext();
    const [typography, setTypography] = useState<TypographyValue>();
    const { themeEmotionMap } = useRichTextEditor();
    const { element } = useCurrentElement();
    const isTypographySelected = $isTypographyNode(element);
    const isParagraphSelected = $isParagraphNode(element);
    const isHeadingSelected = $isHeadingNode(element);
    const isQuoteSelected = $isQuoteNode(element);

    const setTypographySelect = useCallback(
        (value: TypographyValue) => {
            setTypography(value);
        },
        [typography]
    );

    const onTypographySelect = useCallback((value: TypographyValue) => {
        setTypographySelect(value);
        if (value.tag.includes("h") || value.tag.includes("p")) {
            editor.dispatchCommand<LexicalCommand<TypographyPayload>>(ADD_TYPOGRAPHY_COMMAND, {
                value
            });
        }

        if (value.tag === "ol") {
            editor.dispatchCommand<LexicalCommand<ListCommandPayload>>(
                INSERT_ORDERED_LIST_COMMAND,
                {
                    themeStyleId: value.id
                }
            );
        }

        if (value.tag === "ul") {
            editor.dispatchCommand<LexicalCommand<ListCommandPayload>>(
                INSERT_UNORDERED_LIST_COMMAND,
                {
                    themeStyleId: value.id
                }
            );
        }

        if (value.tag === "quoteblock") {
            editor.dispatchCommand<LexicalCommand<QuoteCommandPayload>>(INSERT_QUOTE_COMMAND, {
                themeStyleId: value.id
            });
        }
    }, []);

    useEffect(() => {
        if (!element) {
            return;
        }
        // header and paragraph elements inserted with typography node
        if (isTypographySelected) {
            const el = element as TypographyNode;
            setTypography(el.getTypographyValue());
            return;
        }

        if (isParagraphSelected || isHeadingSelected || isQuoteSelected) {
            const styleId = element.getTypographyStyleId();
            if (!styleId) {
                return;
            }

            if (!themeEmotionMap) {
                return;
            }

            const style = themeEmotionMap[styleId];
            if (style) {
                setTypography({
                    name: style?.name,
                    id: style.id,
                    css: style.styles,
                    tag: style.tag
                });
            }
            return;
        }

        // list and quote element
        if (themeEmotionMap && element?.getStyleId) {
            const themeStyleId = element?.getStyleId() || undefined;
            if (themeStyleId) {
                const elementStyle = themeEmotionMap[themeStyleId];
                if (elementStyle) {
                    setTypography({
                        id: elementStyle.id,
                        css: elementStyle.styles,
                        name: elementStyle.name,
                        tag: elementStyle.tag
                    });
                }
            }
        }
    }, [element, isTypographySelected, isQuoteSelected, isParagraphSelected, isHeadingSelected]);

    return (
        <TypographyActionContext.Provider
            value={{
                value: typography,
                applyTypography: onTypographySelect
            }}
        >
            <BaseTypographyActionDropDown />
        </TypographyActionContext.Provider>
    );
};

TypographyAction.TypographyDropDown = TypographyActionDropDown;
