import React, { useEffect, createElement } from "react";
import MediumEditor from "medium-editor";
import { css } from "emotion";

const editorClass = css({
    width: "100%",
    "&:focus": {
        outline: "none"
    },
    "& b": {
        fontWeight: "bold"
    },
    "& u": {
        textDecoration: "underline"
    },
    "& i": {
        fontStyle: "italic"
    },
    "& h1,h2,h3,h4,h5,h6": {
        fontSize: "unset"
    }
});

type ReactMediumEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onSelect: () => void;
    tag: string;
    options?: any;
    [key: string]: any;
};

const ReactMediumEditor = ({
    tag = "div",
    value,
    onChange,
    options,
    onSelect,
    elementId,
    ...props
}: ReactMediumEditorProps) => {
    const elementRef = React.useRef();
    const editorRef = React.useRef<MediumEditor.MediumEditor>();

    const handleChange = (data, editable) => {
        if (typeof onChange === "function") {
            onChange(editable.innerHTML);
        }
    };

    const handleSelect = () => {
        if (typeof onSelect === "function") {
            onSelect();
        }
    };

    useEffect(() => {
        if (!elementRef && !elementRef.current) {
            return;
        }
        // Create "MediumEditor" instance
        editorRef.current = new MediumEditor(elementRef.current, {
            extensions: {
                // https://github.com/yabwe/medium-editor#disable-file-dragging
                // Disable file dragging by providing a dummy ImageDragging extension.
                imageDragging: {}
            },
            ...options,
            toolbar: {
                ...options.toolbar,
                buttons: [...options.toolbar.buttons, "removeFormat"]
            }
        });

        editorRef.current.subscribe("blur", handleChange);
        editorRef.current.subscribe("editableInput", handleSelect);

        return () => {
            console.log("Destroying editor", elementId);
            editorRef.current.destroy();
        };
    }, [options]);

    return createElement(tag, {
        ...props,
        dangerouslySetInnerHTML: { __html: value },
        ref: elementRef,
        className: editorClass
    });
};

export default React.memo(ReactMediumEditor);
