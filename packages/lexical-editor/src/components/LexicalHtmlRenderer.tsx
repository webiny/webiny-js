import React, { useRef } from "react";
import { Klass, LexicalNode } from "lexical";
import { ClassNames, CSSObject } from "@emotion/react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { allNodes } from "@webiny/lexical-nodes";
import {
    createTheme,
    WebinyTheme,
    ThemeEmotionMap,
    toTypographyEmotionMap
} from "@webiny/lexical-theme";
import { isValidLexicalData } from "~/utils/isValidLexicalData";
import { generateInitialLexicalValue } from "~/utils/generateInitialLexicalValue";
import { LexicalValue } from "~/types";
import { UpdateStatePlugin } from "~/plugins/LexicalUpdateStatePlugin";

interface LexicalHtmlRendererProps {
    nodes?: Klass<LexicalNode>[];
    value: LexicalValue | null;
    theme: WebinyTheme;
    themeEmotionMap?: ThemeEmotionMap;
    themeStylesTransformer?: (cssObject: Record<string, any>) => CSSObject;
}

export const BaseLexicalHtmlRenderer: React.FC<LexicalHtmlRendererProps> = ({
    nodes,
    value,
    theme,
    themeEmotionMap
}) => {
    const editorTheme = useRef(createTheme());
    const editorValue = isValidLexicalData(value) ? value : generateInitialLexicalValue();

    const initialConfig = {
        // We update the state via the `<LexicalUpdateStatePlugin/>`.
        editorState: null,
        namespace: "webiny",
        onError: () => {
            // Ignore errors. We don't want to break the app because of errors caused by config/value updates.
            // These are usually resolved in the next component render cycle.
        },
        editable: false,
        nodes: [...allNodes, ...(nodes || [])],
        theme: { ...editorTheme.current, emotionMap: themeEmotionMap, styles: theme.styles }
    };

    return (
        <LexicalComposer initialConfig={initialConfig} key={initialConfig.nodes.length}>
            <RichTextPlugin
                contentEditable={
                    <div className="editor">
                        <ContentEditable />
                    </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
                placeholder={null}
            />
            <UpdateStatePlugin value={editorValue} />
        </LexicalComposer>
    );
};

/**
 * @description Main editor container
 */
export const LexicalHtmlRenderer: React.FC<LexicalHtmlRendererProps> = props => {
    return (
        <ClassNames>
            {({ css }) => {
                const themeEmotionMap =
                    props?.themeEmotionMap ??
                    toTypographyEmotionMap(css, props.theme, props.themeStylesTransformer);
                return <BaseLexicalHtmlRenderer {...props} themeEmotionMap={themeEmotionMap} />;
            }}
        </ClassNames>
    );
};
