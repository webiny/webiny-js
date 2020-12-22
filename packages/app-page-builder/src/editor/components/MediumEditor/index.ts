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
    tag?: string;
    options?: any;
    disableEditing: boolean;
    [key: string]: any;
};

const ReactMediumEditor = ({
    tag = "div",
    value,
    options,
    disableEditing,
    ...props
}: ReactMediumEditorProps) => {
    const elementRef = React.useRef();
    const editorRef = React.useRef();

    React.useEffect(() => {
        if (!elementRef && !elementRef.current) {
            return;
        }

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
            },
            disableEditing
        });

        const handleChange = (data, editable) => {
            if (props.onChange) {
                // @ts-ignore
                editorRef.current.restoreSelection();
                props.onChange(editable.innerHTML);
            }
        };

        // Subscribe to onchange
        // @ts-ignore
        editorRef.current.subscribe("blur", handleChange);

        return () => {
            // UnSubscribe to onchange
            // @ts-ignore
            editorRef.current.unsubscribe("blur", handleChange);
            // @ts-ignore
            editorRef.current.destroy();
        };
    }, [props, options]);

    if (editorRef.current) {
        // @ts-ignore
        editorRef.current.saveSelection();
    }

    return React.createElement(tag, {
        ...props,
        dangerouslySetInnerHTML: { __html: value },
        ref: elementRef,
        className: editorClass
    });
};

export default React.memo(ReactMediumEditor);
