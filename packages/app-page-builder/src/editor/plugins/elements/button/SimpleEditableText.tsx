import React, { useCallback, useRef } from "react";

type SimpleTextPropsType = {
    value?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    onChange: (value: string) => void;
    options?: Record<keyof HTMLElement, any>;
    element?: string;
};
const SimpleEditableText: React.FunctionComponent<SimpleTextPropsType> = ({
    value: defaultValue = "",
    onFocus,
    onBlur,
    onChange,
    options = {},
    element
}) => {
    const value = useRef<string>(defaultValue);

    const onChangeHandler = useCallback(
        (ev: InputEvent) => {
            const target = ev.target as HTMLElement;
            const elementValue = target.innerHTML || "";
            ev.preventDefault();
            ev.stopPropagation();
            if (elementValue === value.current) {
                return false;
            }
            value.current = elementValue;
            onChange(elementValue);
        },
        [onChange]
    );

    const onBlurHandler = useCallback(() => {
        if (!onBlur) {
            return;
        }
        onBlur();
    }, [onBlur]);

    const onFocusHandler = useCallback(() => {
        if (!onFocus) {
            return;
        }
        onFocus();
    }, [onFocus]);

    return React.createElement(element || "div", {
        contentEditable: true,
        onInput: onChangeHandler,
        onBlur: onBlurHandler,
        onFocus: onFocusHandler,
        "data-texteditor": true,
        dangerouslySetInnerHTML: {
            __html: value.current
        },
        ...options
    });
};

export default React.memo(SimpleEditableText);
