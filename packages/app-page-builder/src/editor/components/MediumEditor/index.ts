import React, { useEffect, createElement, useCallback } from "react";
import MediumEditor, { CoreOptions } from "medium-editor";
import { css } from "emotion";
import merge from "lodash/merge";
import dotProp from "dot-prop-immutable";

const editorClass = css({
    width: "100%",
    "&:focus": {
        outline: "none"
    }
});

interface ReactMediumEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (value: string) => void;
    tag: string | [string, Record<string, any>];
    options?: CoreOptions;
    autoFocus?: boolean;
    [key: string]: any;
}

const ReactMediumEditor = ({
    tag = "div",
    value,
    onChange,
    options = {},
    onSelect,
    autoFocus
}: ReactMediumEditorProps) => {
    const elementRef = React.useRef<HTMLElement>(null);
    const editorRef = React.useRef<MediumEditor.MediumEditor>();

    const handleChange = useCallback(
        (_: any, editable: HTMLElement): void => {
            if (typeof onChange !== "function") {
                return;
            }
            onChange(editable.innerHTML);
        },
        [onChange]
    );

    const handleSelect = useCallback(
        (_: any, editable: HTMLElement): void => {
            if (typeof onSelect !== "function") {
                return;
            }
            onSelect(editable.innerHTML);
        },
        [onSelect]
    );

    const tagName = Array.isArray(tag) ? tag[0] : tag;
    const tagProps = Array.isArray(tag) && tag[1] ? tag[1] : {};

    /**
     * Here we're recreating the "Medium editor" whenever the "tag" changes because that's the element editor is mounted on.
     */
    useEffect(() => {
        if (!elementRef || !elementRef.current) {
            return;
        }
        let mediumEditorOptions = merge(
            {
                extensions: {
                    // https://github.com/yabwe/medium-editor#disable-file-dragging
                    // Disable file dragging by providing a dummy ImageDragging extension.
                    imageDragging: {}
                }
            },
            options
        );
        // Add "removeFormat" button to toolbar
        mediumEditorOptions = dotProp.set(
            mediumEditorOptions,
            "toolbar.buttons",
            (buttons: string[]) => [...buttons, "removeFormat"]
        );
        // Create "MediumEditor" instance
        editorRef.current = new MediumEditor(elementRef.current, mediumEditorOptions);

        return () => {
            if (!editorRef.current) {
                return;
            }
            editorRef.current.destroy();
        };
    }, [options, tagName]);

    // We need to resubscribe "blur" and "editableInput" to use
    // up-to-date versions of onChange and onSelect functions
    useEffect(() => {
        if (!editorRef || !editorRef.current) {
            return;
        }

        editorRef.current.subscribe("blur", handleChange);
        editorRef.current.subscribe("editableInput", handleSelect);

        return () => {
            if (!editorRef.current) {
                return;
            }
            editorRef.current.unsubscribe("blur", handleChange);
            editorRef.current.unsubscribe("editableInput", handleSelect);
        };
    }, [handleChange, handleSelect, tagName]);

    useEffect(() => {
        if (autoFocus && editorRef.current && elementRef.current) {
            // We need time to finish initialization of Medium Editor
            setTimeout(() => {
                // Approach was taken from: https://github.com/yabwe/medium-editor/issues/850
                editorRef.current?.selectElement(elementRef.current as HTMLElement);
                elementRef.current?.click();
                // @ts-expect-error
                MediumEditor.selection.moveCursor(document, elementRef.current);
            }, 200);
        }
    }, [autoFocus, editorRef.current, elementRef.current]);

    return createElement(tagName, {
        dangerouslySetInnerHTML: { __html: value },
        ref: elementRef,
        ...tagProps,
        className: `${editorClass} ${tagProps["className"]}`
    });
};

export default React.memo(ReactMediumEditor);
