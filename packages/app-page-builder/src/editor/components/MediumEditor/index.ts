import React from "react";
import MediumEditor from "medium-editor";
import { css } from "emotion";
// FIXME: Move to appropriate location
// load theme styles with webpack
require("medium-editor/dist/css/medium-editor.css");
require("medium-editor/dist/css/themes/mani.css");

const editorClass = css({
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
    tag,
    value,
    onChange,
    options,
    onSelect,
    ...props
}: ReactMediumEditorProps) => {
    const elementRef = React.useRef();
    const editorRef = React.useRef<MediumEditor.MediumEditor>();

    React.useEffect(() => {
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

        editorRef.current.subscribe("blur", handleChange);

        editorRef.current.subscribe("editableInput", handleSelect);

        return () => {
            editorRef.current.destroy();
        };
    }, [onChange, options, onSelect]);

    return React.createElement(tag, {
        ...props,
        dangerouslySetInnerHTML: { __html: value },
        ref: elementRef,
        className: editorClass
    });
};

export default React.memo(ReactMediumEditor);
