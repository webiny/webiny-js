import React, { useCallback, useMemo } from "react";
import { HeadingEditor, ParagraphEditor } from "@webiny/lexical-editor";
import { LexicalValue } from "@webiny/lexical-editor/types";
import { isHeadingTag } from "~/utils/isHeadingTag";
import { usePageElements } from "@webiny/app-page-builder-elements";
import { assignStyles } from "@webiny/app-page-builder-elements/utils";

interface LexicalEditorProps {
    tag: string | [string, Record<string, any>];
    value: LexicalValue;
    focus?: boolean;
    onChange?: (value: LexicalValue) => void;
    onBlur?: (editorState: LexicalValue) => void;
    height?: number | string;
    width?: number | string;
}

export const LexicalEditor = ({ tag, value, onChange, ...rest }: LexicalEditorProps) => {
    const { theme } = usePageElements();

    const isHeading = useMemo(() => isHeadingTag(tag), [tag]);

    const themeStylesTransformer = useCallback(
        styles => {
            return assignStyles({
                breakpoints: theme.breakpoints,
                styles
            });
        },
        [theme]
    );

    return (
        <>
            {isHeading ? (
                <HeadingEditor
                    theme={theme}
                    themeStylesTransformer={themeStylesTransformer}
                    value={value}
                    onChange={onChange}
                    {...rest}
                />
            ) : (
                <ParagraphEditor
                    theme={theme}
                    themeStylesTransformer={themeStylesTransformer}
                    value={value}
                    onChange={onChange}
                    {...rest}
                />
            )}
        </>
    );
};
