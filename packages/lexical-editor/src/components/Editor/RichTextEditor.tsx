import React, { Fragment, useRef, useState } from "react";
import { css } from "emotion";
import { CSSObject } from "@emotion/react";
import { Klass, LexicalEditor, LexicalNode } from "lexical";
import { EditorState } from "lexical/LexicalEditorState";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { $isRootTextContentEmpty } from "@lexical/text";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { makeDecoratable } from "@webiny/react-composition";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import {
    createTheme,
    WebinyTheme,
    ThemeEmotionMap,
    toTypographyEmotionMap
} from "@webiny/lexical-theme";
import { allNodes } from "@webiny/lexical-nodes";
import { RichTextEditorProvider } from "~/context/RichTextEditorContext";
import { isValidLexicalData } from "~/utils/isValidLexicalData";
import { UpdateStatePlugin } from "~/plugins/LexicalUpdateStatePlugin";
import { BlurEventPlugin } from "~/plugins/BlurEventPlugin/BlurEventPlugin";
import { LexicalValue, ToolbarActionPlugin } from "~/types";
import { Placeholder } from "~/ui/Placeholder";
import { generateInitialLexicalValue } from "~/utils/generateInitialLexicalValue";
import { SharedHistoryContext, useSharedHistoryContext } from "~/context/SharedHistoryContext";
import {
    LexicalEditorWithConfig,
    useLexicalEditorConfig
} from "~/components/LexicalEditorConfig/LexicalEditorConfig";
import { normalizeInputValue } from "./normalizeInputValue";

export interface RichTextEditorProps {
    children?: React.ReactNode | React.ReactNode[];
    classes?: string;
    contentEditableStyles?: React.CSSProperties;
    focus?: boolean;
    height?: number | string;
    nodes?: Klass<LexicalNode>[];
    onBlur?: (editorState: LexicalValue) => void;
    onChange?: (json: LexicalValue) => void;
    placeholder?: string;
    placeholderStyles?: React.CSSProperties;
    staticToolbar?: React.ReactNode;
    styles?: React.CSSProperties;
    tag?: string;
    theme: WebinyTheme;
    themeEmotionMap?: ThemeEmotionMap;
    toolbarActionPlugins?: ToolbarActionPlugin[];
    themeStylesTransformer?: (cssObject: Record<string, any>) => CSSObject;
    toolbar?: React.ReactNode;
    value: LexicalValue | null | undefined;
    width?: number | string;
    generateInitialValue?: () => LexicalValue;
}

const BaseRichTextEditor = ({
    toolbar,
    staticToolbar,
    onChange,
    nodes,
    placeholder,
    children,
    onBlur,
    focus,
    styles,
    width,
    height,
    contentEditableStyles,
    placeholderStyles,
    generateInitialValue = generateInitialLexicalValue,
    ...props
}: RichTextEditorProps) => {
    const themeEmotionMap =
        props.themeEmotionMap ??
        toTypographyEmotionMap(css, props.theme, props.themeStylesTransformer);

    const editorTheme = useRef(createTheme());
    const config = useLexicalEditorConfig();
    const { historyState } = useSharedHistoryContext();
    const placeholderElem = (
        <Placeholder styles={placeholderStyles}>{placeholder || "Enter text..."}</Placeholder>
    );
    const scrollRef = useRef(null);
    const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLElement | undefined>(
        undefined
    );
    const onRef = (_floatingAnchorElem: HTMLDivElement) => {
        if (_floatingAnchorElem !== null) {
            setFloatingAnchorElem(_floatingAnchorElem);
        }
    };

    const sizeStyle = {
        height: height || "",
        width: width || ""
    };

    const configNodes = config.nodes.map(node => node.node);
    const configPlugins = config.plugins.map(plugin => (
        <Fragment key={plugin.name}>{plugin.element}</Fragment>
    ));

    const value = normalizeInputValue(props.value);
    const editorValue = isValidLexicalData(value) ? value : generateInitialValue();

    const initialConfig = {
        editorState: null,
        namespace: "webiny",
        onError: () => {
            // Ignore errors. We don't want to break the app because of errors caused by config/value updates.
            // These are usually resolved in the next component render cycle.
        },
        nodes: [...allNodes, ...configNodes, ...(nodes || [])],
        theme: { ...editorTheme.current, emotionMap: themeEmotionMap }
    };

    function handleOnChange(editorState: EditorState, editor: LexicalEditor) {
        editorState.read(() => {
            if (typeof onChange === "function") {
                const editorState = editor.getEditorState();
                const isEditorEmpty = $isRootTextContentEmpty(editor.isComposing(), true);

                const newValue = JSON.stringify(editorState.toJSON());

                // We don't want to call "onChange" if editor text is empty, and original `value` is empty.
                if (!value && isEditorEmpty) {
                    return;
                }

                if (value !== newValue) {
                    onChange(newValue);
                }
            }
        });
    }

    return (
        /**
         * Once the LexicalComposer is mounted, it caches the `initialConfig` internally, and all future
         * updates to the config will be ignored. This is a problem because we pull in Nodes from our config,
         * and initially, there can be multiple re-renders, while the config object is settled.
         *
         * To bypass this issue, we generate a naive `key` based on the number of Nodes.
         */
        <SharedHistoryContext>
            <LexicalComposer initialConfig={initialConfig} key={initialConfig.nodes.length}>
                <RichTextEditorProvider
                    theme={props.theme}
                    themeEmotionMap={themeEmotionMap}
                    toolbarActionPlugins={props.toolbarActionPlugins}
                >
                    {staticToolbar ? staticToolbar : null}
                    <div
                        /* This className is necessary for targeting of editor container from CSS files. */
                        className={"editor-shell"}
                        ref={scrollRef}
                        style={{ ...styles, ...sizeStyle, overflow: "auto", position: "relative" }}
                    >
                        {/* State plugins. */}
                        <OnChangePlugin onChange={handleOnChange} />
                        <UpdateStatePlugin value={editorValue} />
                        <ClearEditorPlugin />
                        <HistoryPlugin externalHistoryState={historyState} />
                        {/* Event plugins. */}
                        {onBlur && <BlurEventPlugin onBlur={onBlur} />}
                        {focus && <AutoFocusPlugin />}
                        {/* External plugins and components. */}
                        {configPlugins}
                        {children}
                        <RichTextPlugin
                            contentEditable={
                                <div className="editor-scroller" style={{ ...sizeStyle }}>
                                    <div className="editor" ref={onRef}>
                                        <ContentEditable
                                            style={{ outline: 0, ...contentEditableStyles }}
                                        />
                                    </div>
                                </div>
                            }
                            placeholder={placeholderElem}
                            ErrorBoundary={LexicalErrorBoundary}
                        />
                        {/* Toolbar. */}
                        {floatingAnchorElem && toolbar}
                    </div>
                </RichTextEditorProvider>
            </LexicalComposer>
        </SharedHistoryContext>
    );
};

/**
 * @description Main editor container
 */
export const RichTextEditor = makeDecoratable("RichTextEditor", (props: RichTextEditorProps) => {
    return (
        <LexicalEditorWithConfig>
            <BaseRichTextEditor {...props} />
        </LexicalEditorWithConfig>
    );
});
