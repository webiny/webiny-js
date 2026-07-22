import React, { useLayoutEffect, useRef } from "react";

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
        <textarea
            ref={ref}
            className={className}
            value={value}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={1}
            onChange={event => onChange(event.target.value)}
            onKeyDown={onKeyDown}
        />
    );
};
