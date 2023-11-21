import React from "react";
import { HeadingEditor, ParagraphEditor } from "@webiny/lexical-editor";
import { LexicalValue } from "@webiny/lexical-editor/types";
import { isHeadingTag } from "~/utils/isHeadingTag";
import { isParagraphTag } from "~/utils/isParagraphTag";
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

export const LexicalEditor: React.FC<LexicalEditorProps> = ({ tag, value, onChange, ...rest }) => {
    const { theme } = usePageElements();
    return (
        <>
            {isHeadingTag(tag) && (
                <HeadingEditor
                    theme={theme}
                    themeStylesTransformer={styles => {
                        return assignStyles({
                            breakpoints: theme.breakpoints,
                            styles
                        });
                    }}
                    value={value}
                    onChange={onChange}
                    {...rest}
                />
            )}
            {isParagraphTag(tag) ? (
                <ParagraphEditor
                    theme={theme}
                    themeStylesTransformer={styles => {
                        return assignStyles({
                            breakpoints: theme.breakpoints,
                            styles
                        });
                    }}
                    value={value}
                    onChange={onChange}
                    {...rest}
                />
            ) : null}
        </>
    );
};
