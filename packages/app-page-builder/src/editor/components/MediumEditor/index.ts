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

const excludeProps = ["elementId"];

const isPropAllowed = (key: string): boolean => {
    return excludeProps.includes(key) !== true;
};

interface ReactMediumEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: () => void;
    tag: string;
    options?: any;
    [key: string]: any;
}

const ReactMediumEditor: React.FunctionComponent<ReactMediumEditorProps> = ({
    tag = "div",
    value,
    onChange,
    options,
    onSelect,
    ...props
}) => {
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
    /**
     * Here we're re-creating the "Medium editor" whenever the "tag" changes because
     * the editor toolbar stops working/responding due to dynamically changed "tag" prop.
     */
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
            editorRef.current.destroy();
        };
    }, [options, tag]);

    const cleanedProps = Object.keys(props).reduce((acc, key) => {
        if (!isPropAllowed(key)) {
            return acc;
        }
        acc[key] = props[key];
        return acc;
    }, {});
    return createElement(tag, {
        ...cleanedProps,
        dangerouslySetInnerHTML: { __html: value },
        ref: elementRef,
        className: editorClass
    });
};

export default React.memo(ReactMediumEditor);
