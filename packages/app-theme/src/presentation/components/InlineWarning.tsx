import React from "react";
import { cn, Text } from "@webiny/admin-ui";
import { ReactComponent as WarningIcon } from "@webiny/icons/error_outline.svg";

/**
 * Accessibility warnings are advisory. They get a small inline marker and a plain sentence — they
 * never block, never turn a panel red, and never open a modal. See the design brief, section 11.
 */
export const WarningMarker = () => {
    return <WarningIcon className="size-4 flex-none fill-warning-default" aria-label="Warning" />;
};

interface WarningNoteProps {
    message: string;
    /** Wrapper classes so the caller can align the note under its own row layout. */
    className?: string;
}

/**
 * A soft, advisory callout — icon plus a plain sentence on a warning tint. It never blocks and never
 * turns a panel red (design brief, section 11); the caller positions it, so it aligns under whatever
 * row raised it rather than assuming a fixed indent.
 */
export const WarningNote = ({ message, className }: WarningNoteProps) => {
    return (
        <div
            className={cn(
                "flex items-start gap-xs rounded-sm bg-warning-subtle px-sm py-xs",
                className
            )}
        >
            <WarningIcon
                className="size-4 flex-none fill-warning-xstrong mt-[1px]"
                aria-hidden={true}
            />
            <Text size="sm" as="span" className="text-warning-xstrong leading-snug">
                {message}
            </Text>
        </div>
    );
};

/** The error counterpart of {@link WarningMarker} — for a hard problem that blocks publishing. */
export const ErrorMarker = () => {
    return <WarningIcon className="size-4 flex-none fill-destructive-default" aria-label="Error" />;
};

/**
 * The error counterpart of {@link WarningNote}: a red callout for a value that is actually invalid
 * (and would block a publish), not merely advisory. Same layout, destructive tint.
 */
export const ErrorNote = ({ message, className }: WarningNoteProps) => {
    return (
        <div
            className={cn(
                "flex items-start gap-xs rounded-sm bg-destructive-subtle px-sm py-xs",
                className
            )}
        >
            <WarningIcon
                className="size-4 flex-none fill-destructive-default mt-[1px]"
                aria-hidden={true}
            />
            <Text size="sm" as="span" className="text-destructive-primary leading-snug">
                {message}
            </Text>
        </div>
    );
};
