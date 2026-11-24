import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    BLUR_COMMAND,
    COMMAND_PRIORITY_LOW,
    SELECTION_CHANGE_COMMAND,
    mergeRegister
} from "lexical";
import { TOGGLE_LINK_COMMAND } from "@webiny/lexical-nodes";
import "./StaticToolbar.css";
import "./FloatingToolbar.css";
import { useLexicalEditorConfig } from "~/components/LexicalEditorConfig/LexicalEditorConfig.js";
import { useRichTextEditor } from "~/hooks/useRichTextEditor.js";
import { useDeriveValueFromSelection } from "~/hooks/useCurrentSelection.js";
import { HIDE_FLOATING_TOOLBAR } from "~/commands/toolbar.js";
import { setFloatingElemPosition } from "~/utils/setFloatingElemPosition.js";

export interface FloatingToolbarProps {
    /**
     * Classes of the toolbar element. The default, `static-toolbar floating-toolbar`, styles the
     * buttons as the static toolbar's, in a floating panel.
     */
    className?: string;
}

/**
 * Focus can move into these without the toolbar closing: the toolbar itself, and the drop-downs
 * its buttons open (they render in a portal).
 */
function isPartOfToolbar(toolbar: HTMLElement | null, target: EventTarget | null) {
    if (!(target instanceof Element)) {
        return false;
    }
    if (toolbar?.contains(target)) {
        return true;
    }
    return Boolean(target.closest(".lexical-dropdown, [data-radix-popper-content-wrapper]"));
}

/**
 * The toolbar's buttons (the config's `toolbarElements`, as `StaticToolbar` shows them) in a
 * panel above the selected text. It shows while text is selected, and hides while the link
 * form is open.
 *
 * Use it as the editor's `toolbar`, or register it as the toolbar container in config.
 */
export const FloatingToolbar = ({
    className = "static-toolbar floating-toolbar"
}: FloatingToolbarProps) => {
    const { editor, getOverlaysElement } = useRichTextEditor();
    const { toolbarElements } = useLexicalEditorConfig();
    const toolbarRef = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const hasSelectedText = useDeriveValueFromSelection(({ rangeSelection }) => {
        return rangeSelection ? !rangeSelection.isCollapsed() : false;
    });

    const updatePosition = useCallback(() => {
        const toolbar = toolbarRef.current;
        const rootElement = editor.getRootElement();
        const nativeSelection = window.getSelection();
        if (!toolbar || !rootElement || !nativeSelection || nativeSelection.rangeCount === 0) {
            return;
        }
        if (nativeSelection.isCollapsed || !rootElement.contains(nativeSelection.anchorNode)) {
            return;
        }
        setFloatingElemPosition(nativeSelection.getRangeAt(0), toolbar, { placement: "above" });
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(() => updatePosition()),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    setIsVisible(true);
                    updatePosition();
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                BLUR_COMMAND,
                event => {
                    if (!isPartOfToolbar(toolbarRef.current, event.relatedTarget)) {
                        setIsVisible(false);
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                HIDE_FLOATING_TOOLBAR,
                () => {
                    setIsVisible(false);
                    return true;
                },
                COMMAND_PRIORITY_LOW
            ),
            // The link form opens over the selection: the toolbar steps aside.
            editor.registerCommand(
                TOGGLE_LINK_COMMAND,
                payload => {
                    if (payload) {
                        setIsVisible(false);
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, updatePosition]);

    // Scrolling anything (the page, a table, a dialog) moves the selection.
    useEffect(() => {
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [updatePosition]);

    const show = isVisible && hasSelectedText && editor.isEditable();

    useEffect(() => {
        if (show) {
            updatePosition();
        }
    }, [show, updatePosition]);

    if (!show) {
        return null;
    }

    return createPortal(
        <div ref={toolbarRef} className={className} data-role={"toolbar"}>
            {toolbarElements.map(action => (
                <Fragment key={action.name}>{action.element}</Fragment>
            ))}
        </div>,
        getOverlaysElement()
    );
};
