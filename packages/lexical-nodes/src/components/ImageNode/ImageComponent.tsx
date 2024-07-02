/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import * as React from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import type { LexicalEditor, NodeKey, BaseSelection } from "lexical";

import "./ImageComponent.css";

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    $setSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    DRAGSTART_COMMAND,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { Placeholder } from "./Placeholder";
import { ImageResizer } from "./ImageResizer";
import { useSharedHistoryContext } from "./SharedHistoryContext";
import { $isImageNode } from "~/ImageNode";
import { LexicalContentEditable } from "./ContentEditable";

const imageCache = new Set();

function useSuspenseImage(src: string) {
    if (!imageCache.has(src)) {
        throw new Promise(resolve => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                imageCache.add(src);
                resolve(null);
            };
        });
    }
}

function LazyImage({
    id,
    altText,
    className,
    imageRef,
    src,
    width,
    height,
    maxWidth
}: {
    id: string;
    altText: string;
    className: string | null;
    height: "inherit" | number;
    imageRef: { current: null | HTMLImageElement };
    maxWidth: number;
    src: string;
    width: "inherit" | number;
}): JSX.Element {
    useSuspenseImage(src);
    return (
        <img
            id={id}
            className={className || undefined}
            src={src}
            alt={altText}
            ref={imageRef}
            style={{
                height,
                maxWidth,
                width
            }}
            draggable="false"
        />
    );
}

interface ImageComponentProps {
    id: string;
    altText: string;
    caption: LexicalEditor;
    height: "inherit" | number;
    maxWidth: number;
    nodeKey: NodeKey;
    resizable: boolean;
    showCaption: boolean;
    src: string;
    width: "inherit" | number;
    captionsEnabled: boolean;
}

export default function ImageComponent({
    id,
    src,
    altText,
    nodeKey,
    width,
    height,
    maxWidth,
    resizable,
    showCaption,
    caption,
    captionsEnabled
}: ImageComponentProps): JSX.Element {
    const imageRef = useRef<null | HTMLImageElement>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [editor] = useLexicalComposerContext();
    const [selection, setSelection] = useState<BaseSelection | null>(null);
    const activeEditorRef = useRef<LexicalEditor | null>(null);

    const onDelete = useCallback(
        (payload: KeyboardEvent) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event: KeyboardEvent = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if ($isImageNode(node)) {
                    node.remove();
                }
                setSelected(false);
            }
            return false;
        },
        [isSelected, nodeKey, setSelected]
    );

    const onEnter = useCallback(
        (event: KeyboardEvent) => {
            const latestSelection = $getSelection();
            const buttonElem = buttonRef.current;
            if (
                isSelected &&
                $isNodeSelection(latestSelection) &&
                latestSelection.getNodes().length === 1
            ) {
                if (showCaption) {
                    // Move focus into nested editor
                    $setSelection(null);
                    event.preventDefault();
                    caption.focus();
                    return true;
                } else if (buttonElem !== null && buttonElem !== document.activeElement) {
                    event.preventDefault();
                    buttonElem.focus();
                    return true;
                }
            }
            return false;
        },
        [caption, isSelected, showCaption]
    );

    const onEscape = useCallback(
        (event: KeyboardEvent) => {
            if (activeEditorRef.current === caption || buttonRef.current === event.target) {
                $setSelection(null);
                editor.update(() => {
                    setSelected(true);
                    const parentRootElement = editor.getRootElement();
                    if (parentRootElement !== null) {
                        parentRootElement.focus();
                    }
                });
                return true;
            }
            return false;
        },
        [caption, editor, setSelected]
    );

    useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                if (isMounted) {
                    setSelection(editorState.read(() => $getSelection()));
                }
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_, activeEditor) => {
                    activeEditorRef.current = activeEditor;
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand<MouseEvent>(
                CLICK_COMMAND,
                payload => {
                    const event = payload;
                    if (isResizing) {
                        return true;
                    }
                    if (event.target === imageRef.current) {
                        if (event.shiftKey) {
                            setSelected(!isSelected);
                        } else {
                            clearSelection();
                            setSelected(true);
                        }
                        return true;
                    }

                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                DRAGSTART_COMMAND,
                event => {
                    if (event.target === imageRef.current) {
                        // TODO This is just a temporary workaround for FF to behave like other browsers.
                        // Ideally, this handles drag & drop too (and all browsers).
                        event.preventDefault();
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
            editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
            editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
            editor.registerCommand(KEY_ESCAPE_COMMAND, onEscape, COMMAND_PRIORITY_LOW)
        );
        return () => {
            isMounted = false;
            unregister();
        };
    }, [
        clearSelection,
        editor,
        isResizing,
        isSelected,
        nodeKey,
        onDelete,
        onEnter,
        onEscape,
        setSelected
    ]);

    const setShowCaption = () => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.setShowCaption(true);
            }
        });
    };

    const onResizeEnd = (nextWidth: "inherit" | number, nextHeight: "inherit" | number) => {
        // Delay hiding the resize bars for click case
        setTimeout(() => {
            setIsResizing(false);
        }, 200);

        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.setWidthAndHeight(nextWidth, nextHeight);
            }
        });
    };

    const onResizeStart = () => {
        setIsResizing(true);
    };

    const { historyState } = useSharedHistoryContext();
    const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
    const isFocused = isSelected || isResizing;
    return (
        <Suspense fallback={null}>
            <>
                <div draggable={draggable}>
                    <LazyImage
                        id={id}
                        className={
                            isFocused
                                ? `focused ${$isNodeSelection(selection) ? "draggable" : ""}`
                                : null
                        }
                        src={src}
                        altText={altText}
                        imageRef={imageRef}
                        width={width}
                        height={height}
                        maxWidth={maxWidth}
                    />
                </div>
                {showCaption && (
                    <div className="image-caption-container">
                        <LexicalNestedComposer initialEditor={caption}>
                            <AutoFocusPlugin />
                            <HistoryPlugin externalHistoryState={historyState} />
                            <RichTextPlugin
                                contentEditable={
                                    <LexicalContentEditable className="ImageNode__contentEditable" />
                                }
                                placeholder={
                                    <Placeholder className="ImageNode__placeholder">
                                        Enter a caption...
                                    </Placeholder>
                                }
                                ErrorBoundary={LexicalErrorBoundary}
                            />
                        </LexicalNestedComposer>
                    </div>
                )}
                {resizable && $isNodeSelection(selection) && isFocused && (
                    <ImageResizer
                        showCaption={showCaption}
                        setShowCaption={setShowCaption}
                        editor={editor}
                        buttonRef={buttonRef}
                        imageRef={imageRef}
                        maxWidth={maxWidth}
                        onResizeStart={onResizeStart}
                        onResizeEnd={onResizeEnd}
                        captionsEnabled={captionsEnabled}
                    />
                )}
            </>
        </Suspense>
    );
}
