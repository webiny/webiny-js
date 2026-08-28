import React, { useLayoutEffect, useRef } from "react";
import { TextareaPrimitive } from "@webiny/admin-ui";

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    /** Height (px) at which the textarea stops growing and starts scrolling. */
    maxHeight?: number;
    onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

/**
 * A controlled textarea that grows with its content (starting at one line) up to `maxHeight`,
 * then scrolls. Keeps long comments and replies readable while typing.
 */
export const AutoTextarea = ({
    value,
    onChange,
    placeholder,
    className,
    autoFocus,
    maxHeight = 220,
    onKeyDown
}: Props) => {
    const ref = useRef<HTMLTextAreaElement>(null);

    const resize = () => {
        const el = ref.current;
        if (!el) {
            return;
        }
        el.style.height = "auto";
        const next = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${next}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    };

    useLayoutEffect(() => {
        resize();
    }, [value]);

    return (
        <TextareaPrimitive
            textareaRef={ref}
            variant="ghost"
            className={`${className ?? ""} min-h-0`}
            value={value}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={1}
            // `TextareaPrimitive` forwards the value (not the event) to `onChange` by default,
            // which is exactly what `AutoTextarea` needs. The primitive still types the prop as a
            // native change handler, so we bridge the value-based callback here.
            onChange={onChange as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
            onKeyDown={onKeyDown}
        />
    );
};
