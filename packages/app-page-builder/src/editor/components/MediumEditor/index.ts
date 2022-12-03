import React, { useEffect, createElement } from "react";
import MediumEditor, { CoreOptions } from "medium-editor";
import { css } from "emotion";
import merge from "lodash/merge";
import dotProp from "dot-prop-immutable";

const editorClass = css({
    width: "auto",
    "&:focus": {
        outline: "none"
    }
});

interface ReactMediumEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: () => void;
    tag: string | [string, Record<string, any>];
    options?: CoreOptions;
    [key: string]: any;
}

const ReactMediumEditor: React.FC<ReactMediumEditorProps> = ({
    tag = "div",
    value,
    onChange,
    options = {},
    onSelect
}) => {
    const elementRef = React.useRef<HTMLElement>(null);
    const editorRef = React.useRef<MediumEditor.MediumEditor>();

    const handleChange = (_: any, editable: HTMLElement): void => {
        if (typeof onChange !== "function") {
            return;
        }
        onChange(editable.innerHTML);
    };

    const handleSelect = (): void => {
        if (typeof onSelect !== "function") {
            return;
        }
        onSelect();
    };

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

        editorRef.current.subscribe("blur", handleChange);
        editorRef.current.subscribe("editableInput", handleSelect);

        return () => {
            if (!editorRef.current) {
                return;
            }
            editorRef.current.destroy();
        };
    }, [options, tagName]);

    return createElement(tagName, {
        dangerouslySetInnerHTML: { __html: value },
        ref: elementRef,
        ...tagProps,
        className: `${editorClass} ${tagProps["className"]}`
    });
};

export default React.memo(ReactMediumEditor);
