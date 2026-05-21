import React, { Fragment, useId, useRef, useState } from "react";
import type { Klass, LexicalNode } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { makeDecoratable } from "@webiny/react-composition";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import type { EditorTheme } from "@webiny/lexical-theme";
import { allNodes } from "@webiny/lexical-nodes";
import { RichTextEditorProvider } from "~/context/RichTextEditorContext.js";
import { BlurEventPlugin } from "~/plugins/BlurEventPlugin/BlurEventPlugin.js";
import type { LexicalValue, ToolbarActionPlugin } from "~/types.js";
import { Placeholder } from "~/ui/Placeholder.js";
import { SharedHistoryContext, useSharedHistoryContext } from "~/context/SharedHistoryContext.js";
import {
    LexicalEditorWithConfig,
    useLexicalEditorConfig
} from "~/components/LexicalEditorConfig/LexicalEditorConfig.js";
import { StateHandlingPlugin } from "~/plugins/StateHandlingPlugin.js";

export type InitialEditorConfig = React.ComponentProps<typeof LexicalComposer>["initialConfig"] & {
    editorId: string;
};

export interface RichTextEditorProps {
    children?: React.ReactNode | React.ReactNode[];
    classes?: string;
    disabled?: boolean;
    contentEditableStyles?: React.CSSProperties;
    focus?: boolean;
    height?: number | string;
    nodes?: Klass<LexicalNode>[];
    onBlur?: (editorState: LexicalValue) => void;
    onChange?: (value: LexicalValue) => void;
    placeholder?: string;
    placeholderStyles?: React.CSSProperties;
    staticToolbar?: React.ReactNode;
    styles?: React.CSSProperties;
    tag?: string;
    theme: EditorTheme;
    toolbarActionPlugins?: ToolbarActionPlugin[];
    toolbar?: React.ReactNode;
    value: LexicalValue | null | undefined;
    configRef?: React.MutableRefObject<InitialEditorConfig | undefined>;
    width?: number | string;
}

const BaseRichTextEditor = ({
    onChange,
    toolbar,
    staticToolbar,
    nodes,
    placeholder,
    children,
    onBlur,
    focus,
    styles,
    width,
    disabled = false,
    height,
    contentEditableStyles,
    placeholderStyles,
    ...props
}: RichTextEditorProps) => {
    const editorTheme = useRef(props.theme);
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

    const initialConfig = {
        editorId: useId(),
        editable: !disabled,
        namespace: "webiny",
        onError: () => {
            // Ignore errors. We don't want to break the app because of errors caused by config/value updates.
            // These are usually resolved in the next component render cycle.
        },
        nodes: [...allNodes, ...configNodes, ...(nodes || [])],
        theme: {
            ...editorTheme.current.tokens,
            // I'm not aware of a better way to pass custom data to nodes.
            // For now, we're using Lexical's theme to pass colors and typography.
            $colors: editorTheme.current.colors,
            $typography: editorTheme.current.typography,
            $cacheKey: JSON.stringify(editorTheme.current)
        }
    };

    if (props.configRef) {
        props.configRef.current = initialConfig;
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
                    toolbarActionPlugins={props.toolbarActionPlugins}
                >
                    {staticToolbar && !disabled ? staticToolbar : null}
                    <div data-role={"overlays"} className={"relative"}></div>
                    <div
                        /* This className is necessary for targeting of editor container from CSS files. */
                        className={"editor-shell"}
                        ref={scrollRef}
                        style={{
                            ...styles,
                            ...sizeStyle,
                            overflow: "auto",
                            position: "relative"
                        }}
                    >
                        {/* State plugins. */}
                        <StateHandlingPlugin
                            value={props.value}
                            onChange={disabled ? undefined : onChange}
                        />
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
                                            disabled={disabled}
                                            style={{ outline: 0, ...contentEditableStyles }}
                                        />
                                    </div>
                                </div>
                            }
                            placeholder={placeholderElem}
                            ErrorBoundary={LexicalErrorBoundary}
                        />
                        {/* Toolbar. */}
                        {disabled ? null : floatingAnchorElem && toolbar}
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

export namespace RichTextEditor {
    export type InitialConfig = InitialEditorConfig;
}
