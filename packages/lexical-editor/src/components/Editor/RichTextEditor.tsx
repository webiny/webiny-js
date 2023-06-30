import React, { useEffect, useRef, useState } from "react";
import { LexicalValue, ThemeEmotionMap } from "~/types";
import { Placeholder } from "~/ui/Placeholder";
import { generateInitialLexicalValue } from "~/utils/generateInitialLexicalValue";
import { EditorState } from "lexical/LexicalEditorState";
import { Klass, LexicalEditor, LexicalNode } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { makeComposable } from "@webiny/react-composition";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextEditorProvider } from "~/context/RichTextEditorContext";
import { isValidLexicalData } from "~/utils/isValidLexicalData";
import { LexicalUpdateStatePlugin } from "~/plugins/LexicalUpdateStatePlugin";
import { BlurEventPlugin } from "~/plugins/BlurEventPlugin/BlurEventPlugin";
import { FontColorPlugin } from "~/plugins/FontColorPlugin/FontColorPlugin";
import { webinyEditorTheme, WebinyTheme } from "~/themes/webinyLexicalTheme";
import { WebinyNodes } from "~/nodes/webinyNodes";
import { TypographyPlugin } from "~/plugins/TypographyPlugin/TypographyPlugin";
import { QuotePlugin } from "~/plugins/WebinyQuoteNodePlugin/WebinyQuoteNodePlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { SharedHistoryContext, useSharedHistoryContext } from "~/context/SharedHistoryContext";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { ClassNames } from "@emotion/react";
import { toTypographyEmotionMap } from "~/utils/toTypographyEmotionMap";

export interface RichTextEditorProps {
    toolbar?: React.ReactNode;
    tag?: string;
    onChange?: (json: LexicalValue) => void;
    value: LexicalValue | null;
    focus?: boolean;
    placeholder?: string;
    nodes?: Klass<LexicalNode>[];
    /**
     * @description Lexical plugins
     */
    children?: React.ReactNode | React.ReactNode[];
    onBlur?: (editorState: LexicalValue) => void;
    height?: number | string;
    width?: number | string;
    /*
     * @description Theme to be injected into lexical editor
     */
    theme: WebinyTheme;
    themeStylesTransformer?: any;
    themeEmotionMap?: ThemeEmotionMap;
}

const BaseRichTextEditor: React.FC<RichTextEditorProps> = ({
    toolbar,
    onChange,
    value,
    nodes,
    placeholder,
    children,
    onBlur,
    focus,
    width,
    height,
    theme,
    themeEmotionMap
}: RichTextEditorProps) => {
    const { historyState } = useSharedHistoryContext();
    const placeholderElem = <Placeholder>{placeholder || "Enter text..."}</Placeholder>;
    const scrollRef = useRef(null);
    const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLElement | undefined>(
        undefined
    );
    const { setTheme, setThemeEmotionMap } = useRichTextEditor();

    useEffect(() => {
        setTheme(theme);
        setThemeEmotionMap(themeEmotionMap);
    }, [themeEmotionMap]);

    const onRef = (_floatingAnchorElem: HTMLDivElement) => {
        if (_floatingAnchorElem !== null) {
            setFloatingAnchorElem(_floatingAnchorElem);
        }
    };

    const sizeStyle = {
        height: height || "",
        width: width || ""
    };

    const initialConfig = {
        editorState: isValidLexicalData(value) ? value : generateInitialLexicalValue(),
        namespace: "webiny",
        onError: (error: Error) => {
            throw error;
        },
        nodes: [...WebinyNodes, ...(nodes || [])],
        theme: { ...webinyEditorTheme, emotionMap: themeEmotionMap }
    };

    function handleOnChange(editorState: EditorState, editor: LexicalEditor) {
        editorState.read(() => {
            if (typeof onChange === "function") {
                const editorState = editor.getEditorState();
                //TODO: send plain JSON object
                onChange(JSON.stringify(editorState.toJSON()));
            }
        });
    }

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div ref={scrollRef} style={{ ...sizeStyle }}>
                {/* data */}
                <OnChangePlugin onChange={handleOnChange} />
                {value && <LexicalUpdateStatePlugin value={value} />}
                <ClearEditorPlugin />
                <FontColorPlugin />
                <TypographyPlugin />
                <QuotePlugin />
                <HistoryPlugin externalHistoryState={historyState} />
                {/* Events */}
                {onBlur && <BlurEventPlugin onBlur={onBlur} />}
                {focus && <AutoFocusPlugin />}
                {/* External plugins and components */}
                {children}
                <RichTextPlugin
                    contentEditable={
                        <div className="editor-scroller" style={{ ...sizeStyle }}>
                            <div className="editor" ref={onRef} style={{ ...sizeStyle }}>
                                <ContentEditable style={{ outline: 0, ...sizeStyle }} />
                            </div>
                        </div>
                    }
                    placeholder={placeholderElem}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                {/* Toolbar */}
                {floatingAnchorElem && toolbar}
            </div>
        </LexicalComposer>
    );
};

/**
 * @description Main editor container
 */
export const RichTextEditor = makeComposable<RichTextEditorProps>("RichTextEditor", props => {
    return (
        <RichTextEditorProvider>
            <ClassNames>
                {({ css }) => {
                    const themeEmotionMap =
                        props?.themeEmotionMap ?? toTypographyEmotionMap(css, props.theme, props.themeStylesTransformer);
                    return (
                        <SharedHistoryContext>
                            <BaseRichTextEditor {...props} themeEmotionMap={themeEmotionMap} />
                        </SharedHistoryContext>
                    );
                }}
            </ClassNames>
        </RichTextEditorProvider>
    );
});
