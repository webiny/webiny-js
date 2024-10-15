import React, { useCallback } from "react";
import { HeadingEditor, ParagraphEditor } from "@webiny/lexical-editor";
import { LexicalValue } from "@webiny/lexical-editor/types";
import { usePageElements } from "@webiny/app-page-builder-elements";
import { assignStyles } from "@webiny/app-page-builder-elements/utils";
import { StylesObject } from "@webiny/theme/types";

interface LexicalEditorProps {
    type: "heading" | "paragraph";
    value: LexicalValue | undefined;
    placeholder?: string;
    focus?: boolean;
    onChange?: (value: LexicalValue) => void;
    onBlur?: (editorState: LexicalValue) => void;
    height?: number | string;
    width?: number | string;
    children?: React.ReactNode | React.ReactNode[];
}

export const LexicalEditor = ({ type, value, onChange, ...rest }: LexicalEditorProps) => {
    const { theme } = usePageElements();

    const isHeading = type === "heading";

    const themeStylesTransformer = useCallback(
        (styles: StylesObject) => {
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
