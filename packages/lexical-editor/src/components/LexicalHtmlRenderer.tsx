import React from "react";
import { LexicalValue, ThemeEmotionMap } from "~/types";
import { isValidLexicalData } from "~/utils/isValidLexicalData";
import { generateInitialLexicalValue } from "~/utils/generateInitialLexicalValue";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { LexicalUpdateStatePlugin } from "~/plugins/LexicalUpdateStatePlugin";
import { Klass, LexicalNode } from "lexical";
import { WebinyNodes } from "~/nodes/webinyNodes";
import { webinyEditorTheme, WebinyTheme } from "~/themes/webinyLexicalTheme";
import { ClassNames } from "@emotion/react";
import { toTypographyEmotionMap } from "~/utils/toTypographyEmotionMap";

interface LexicalHtmlRendererProps {
    nodes?: Klass<LexicalNode>[];
    value: LexicalValue | null;
    /*
     * @description Theme to be injected into lexical editor
     */
    theme: WebinyTheme;
    themeEmotionMap?: ThemeEmotionMap;
}

export const BaseLexicalHtmlRenderer: React.FC<LexicalHtmlRendererProps> = ({
    nodes,
    value,
    theme,
    themeEmotionMap
}) => {
    const initialConfig = {
        editorState: isValidLexicalData(value) ? value : generateInitialLexicalValue(),
        namespace: "webiny",
        onError: (error: Error) => {
            throw error;
        },
        editable: false,
        nodes: [...WebinyNodes, ...(nodes || [])],
        theme: { ...webinyEditorTheme, emotionMap: themeEmotionMap, styles: theme.styles }
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <RichTextPlugin
                contentEditable={
                    <div className="editor">
                        <ContentEditable />
                    </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
                placeholder={null}
            />
            <LexicalUpdateStatePlugin value={value} />
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
                    props?.themeEmotionMap ?? toTypographyEmotionMap(css, props.theme);
                return <BaseLexicalHtmlRenderer {...props} themeEmotionMap={themeEmotionMap} />;
            }}
        </ClassNames>
    );
};
