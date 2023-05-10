import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalCommand } from "lexical";
import { Compose, makeComposable } from "@webiny/react-composition";
import { TypographyActionContext } from "~/context/TypographyActionContext";

import { TypographyValue } from "~/types";
import {
    $isTypographyElementNode,
    ADD_TYPOGRAPHY_ELEMENT_COMMAND,
    TypographyElementNode,
    TypographyPayload
} from "~/nodes/TypographyElementNode";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import {
    INSERT_ORDERED_WEBINY_LIST_COMMAND,
    INSERT_UNORDERED_WEBINY_LIST_COMMAND,
    WebinyListCommandPayload
} from "~/commands/webiny-list";
import { INSERT_WEBINY_QUOTE_COMMAND, WebinyQuoteCommandPayload } from "~/commands/webiny-quote";
import { $isBaseQuoteNode, BaseQuoteNode } from "~/nodes/BaseQuoteNode";

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

const TypographyActionDropDown: React.FC<TypographyActionDropdownProps> = ({
    element
}): JSX.Element => {
    return <Compose component={BaseTypographyActionDropDown} with={() => () => element} />;
};

export interface TypographyAction extends React.FC<unknown> {
    TypographyDropDown: typeof TypographyActionDropDown;
}

export const TypographyAction: TypographyAction = () => {
    const [editor] = useLexicalComposerContext();
    const [typography, setTypography] = useState<TypographyValue>();
    const { textBlockSelection, themeEmotionMap } = useRichTextEditor();
    const isTypographySelected = textBlockSelection?.state?.typography.isSelected || false;
    const textType = textBlockSelection?.state?.textType;
    const isQuoteSelected = textBlockSelection?.state?.quote.isSelected || false;
    const setTypographySelect = useCallback(
        (value: TypographyValue) => {
            setTypography(value);
        },
        [typography]
    );

    const onTypographySelect = useCallback((value: TypographyValue) => {
        setTypographySelect(value);

        if (value.tag.includes("h") || value.tag.includes("p")) {
            editor.dispatchCommand<LexicalCommand<TypographyPayload>>(
                ADD_TYPOGRAPHY_ELEMENT_COMMAND,
                {
                    value
                }
            );
        }

        if (value.tag === "ol") {
            editor.dispatchCommand<LexicalCommand<WebinyListCommandPayload>>(
                INSERT_ORDERED_WEBINY_LIST_COMMAND,
                {
                    themeStyleId: value.id
                }
            );
        }

        if (value.tag === "ul") {
            editor.dispatchCommand<LexicalCommand<WebinyListCommandPayload>>(
                INSERT_UNORDERED_WEBINY_LIST_COMMAND,
                {
                    themeStyleId: value.id
                }
            );
        }

        if (value.tag === "quoteblock") {
            editor.dispatchCommand<LexicalCommand<WebinyQuoteCommandPayload>>(
                INSERT_WEBINY_QUOTE_COMMAND,
                {
                    themeStyleId: value.id
                }
            );
        }
    }, []);

    useEffect(() => {
        if (textBlockSelection) {
            // header and paragraph elements inserted with typography node
            if ($isTypographyElementNode(textBlockSelection?.element)) {
                const el = textBlockSelection.element as TypographyElementNode;
                setTypography(el.getTypographyValue());
                return;
            }

            // list and quote element
            if (themeEmotionMap && textBlockSelection?.element?.getStyleId) {
                const themeStyleId = textBlockSelection?.element?.getStyleId() || undefined;
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

            if (themeEmotionMap && $isBaseQuoteNode(textBlockSelection?.element)) {
                const quoteElement = textBlockSelection?.element as BaseQuoteNode;
                const quoteTypoId = quoteElement.getTypographyStyleId();
                if (quoteTypoId) {
                    const elementStyle = themeEmotionMap[quoteTypoId];
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
        }
    }, [isQuoteSelected, isTypographySelected, textType]);

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

{
    /* Color action settings */
}
TypographyAction.TypographyDropDown = TypographyActionDropDown;
