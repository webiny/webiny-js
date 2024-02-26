import React, { useCallback, useRef } from "react";

interface SimpleTextPropsType {
    value?: string;
    variableValue?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    onChange: (value: string) => void;
    options?: Partial<Record<keyof HTMLElement, any>>;
    element?: string;
    className?: string;
    focusInput?: boolean;
}
const SimpleEditableText = ({
    value: defaultValue = "",
    variableValue,
    onFocus,
    onBlur,
    onChange,
    options = {},
    element,
    className
}: SimpleTextPropsType) => {
    const value = useRef<string>(defaultValue);
    const inputRef = useRef(null);

    const onChangeHandler = useCallback(
        (ev: InputEvent) => {
            const target = ev.target as HTMLElement;
            // Remove space from HTML
            const elementValue = target.innerHTML.replace(/&nbsp;/gi, "") || "";
            ev.preventDefault();
            ev.stopPropagation();
            if (elementValue === value.current) {
                return false;
            }
            value.current = elementValue;
            return true;
        },
        [onChange]
    );

    const onBlurHandler = useCallback(() => {
        if (!onBlur) {
            return;
        }
        onChange(value.current);
        onBlur();
    }, [onBlur]);

    const onFocusHandler = useCallback(() => {
        if (!onFocus) {
            return;
        }
        onFocus();
    }, [onFocus]);

    return React.createElement(element || "div", {
        className: className || "",
        contentEditable: true,
        onInput: onChangeHandler,
        onBlur: onBlurHandler,
        onFocus: onFocusHandler,
        dangerouslySetInnerHTML: {
            __html: variableValue || value.current
        },
        ref: inputRef,
        ...options
    });
};

export default React.memo(SimpleEditableText);
