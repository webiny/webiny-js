import React, { useCallback, useEffect, useState } from "react";
import type { LexicalCommand } from "lexical";
import { Compose, makeDecoratable } from "@webiny/react-composition";
import type { TypographyValue } from "@webiny/lexical-theme";
import type { ActiveTypography } from "~/context/TypographyActionContext.js";
import { TypographyActionContext } from "~/context/TypographyActionContext.js";
import { $isHeadingNode, $isListNode, $isParagraphNode, $isQuoteNode } from "@webiny/lexical-nodes";
import { useRichTextEditor } from "~/hooks/useRichTextEditor.js";
import type {
    ListCommandPayload,
    QuoteCommandPayload,
    TypographyPayload
} from "~/commands/index.js";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    INSERT_QUOTE_COMMAND,
    ADD_TYPOGRAPHY_COMMAND
} from "~/commands/index.js";
import { useCurrentElement } from "~/hooks/useCurrentElement.js";

// Unfortunately, for some time in v5 we had `quoteblock` in our theme, so let's not break it.
const quoteTagNames = ["blockquote", "quoteblock"];

/*
 * Base composable action component that is mounted on toolbar action as a placeholder for the custom toolbar action.
 * Note: Toa add custom component access trough @see LexicalEditorConfig API
 * */
export const BaseTypographyActionDropDown = makeDecoratable(
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
    const [typography, setTypography] = useState<ActiveTypography>();
    const { editor, theme } = useRichTextEditor();
    const { element } = useCurrentElement();
    const isParagraphSelected = $isParagraphNode(element);
    const isHeadingSelected = $isHeadingNode(element);
    const isQuoteSelected = $isQuoteNode(element);

    const onTypographySelect = useCallback((value: TypographyValue) => {
        setTypography(value);

        if (value.tag.includes("h") || value.tag.includes("p")) {
            editor.dispatchCommand<LexicalCommand<TypographyPayload>>(ADD_TYPOGRAPHY_COMMAND, {
                value
            });
            return;
        }

        if (value.tag === "ol") {
            editor.dispatchCommand<LexicalCommand<ListCommandPayload>>(
                INSERT_ORDERED_LIST_COMMAND,
                {
                    themeStyleId: value.id
                }
            );
            return;
        }

        if (value.tag === "ul") {
            editor.dispatchCommand<LexicalCommand<ListCommandPayload>>(
                INSERT_UNORDERED_LIST_COMMAND,
                {
                    themeStyleId: value.id
                }
            );
            return;
        }

        if (quoteTagNames.includes(value.tag)) {
            editor.dispatchCommand<LexicalCommand<QuoteCommandPayload>>(INSERT_QUOTE_COMMAND, {
                themeStyleId: value.id
            });
        }
    }, []);

    useEffect(() => {
        if (!element) {
            return;
        }

        if (isParagraphSelected || isHeadingSelected || isQuoteSelected) {
            const styleId = element.getStyleId();
            if (!styleId) {
                return;
            }

            const style = theme.getTypographyById(styleId);
            if (style) {
                setTypography({
                    id: style.id,
                    label: style.label
                });
            }
            return;
        }

        // list and quote element
        if ($isListNode(element)) {
            const styleId = element.getStyleId();
            if (!styleId) {
                return;
            }

            const style = theme.getTypographyById(styleId);
            if (style) {
                setTypography({
                    id: style.id,
                    label: style.label
                });
            }
        }
    }, [element, isQuoteSelected, isParagraphSelected, isHeadingSelected]);

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
